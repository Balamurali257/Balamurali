import logging
from datetime import datetime
from flask import (
    Blueprint, render_template, request, redirect, url_for,
    session, flash, jsonify
)
from config import Config
from utils.db import query_db, execute_db
from utils.validators import (
    validate_username, normalize_username, validate_phone_number,
    validate_password_complexity, validate_email, get_safe_redirect
)
from utils.auth_helpers import (
    hash_password, verify_password, rotate_session, login_required
)
from services.twilio_verify import (
    send_otp, verify_otp, mask_phone_number,
    is_twilio_configured, is_whatsapp_configured
)
from services.google_auth import is_google_configured
from services.facebook_auth import is_facebook_configured
from services.apple_auth import is_apple_configured
from services.security import (
    log_auth_event, is_account_locked, record_failed_login,
    reset_failed_login, revoke_user_session, create_password_reset_token,
    verify_password_reset_token, consume_password_reset_token
)

logger = logging.getLogger('carebuddy.auth')
auth_bp = Blueprint('auth', __name__)

def get_providers_status() -> dict:
    """Helper returning operational status of all external providers."""
    return {
        'google': is_google_configured(),
        'facebook': is_facebook_configured(),
        'apple': is_apple_configured(),
        'twilio': is_twilio_configured(),
        'whatsapp': is_whatsapp_configured()
    }

# ==========================================================
# LANDING PAGE
# ==========================================================
@auth_bp.route('/')
def landing():
    if 'user_id' in session:
        return redirect(url_for('dashboard.index'))
    return render_template('index.html')

# ==========================================================
# 1. LOGIN (Sections 9, 10, 11, 28, 38)
# ==========================================================
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session and session.get('phone_verified'):
        return redirect(url_for('dashboard.index'))

    providers = get_providers_status()

    if request.method == 'POST':
        identifier = request.form.get('identifier', '').strip()
        password = request.form.get('password', '')
        remember_me = bool(request.form.get('remember_me'))

        if not identifier or not password:
            flash('Please enter your username, phone number, or email, and your password.', 'danger')
            return render_template('auth/login.html', providers=providers, identifier=identifier)

        # Look up user by normalized username, phone number, or email
        norm_identifier = identifier.lower()
        user = query_db("""
            SELECT * FROM users 
            WHERE username_normalized = %s OR phone_number = %s OR email = %s
        """, (norm_identifier, identifier, norm_identifier), one=True)

        # Check account lockout before checking password (Section 38)
        if user:
            locked, lock_msg = is_account_locked(user)
            if locked:
                log_auth_event(user['id'], 'LOGIN_FAILED', success=False, failure_reason='Account locked')
                flash(lock_msg, 'danger')
                return render_template('auth/login.html', providers=providers, identifier=identifier)

        # Verify password using Werkzeug check_password_hash
        if not user or not user.get('password_hash') or not verify_password(user['password_hash'], password):
            if user:
                record_failed_login(user['id'])
                log_auth_event(user['id'], 'LOGIN_FAILED', success=False, failure_reason='Invalid password')
            else:
                log_auth_event(None, 'LOGIN_FAILED', success=False, failure_reason='User not found')
            flash('Invalid credentials. Please verify your username, phone, or password.', 'danger')
            return render_template('auth/login.html', providers=providers, identifier=identifier)

        # Check if account is disabled or deactivated
        if user.get('account_status') in ('DISABLED', 'SUSPENDED', 'DEACTIVATED') or not user.get('is_active'):
            flash('Your CareBuddy account has been disabled. Please contact support.', 'danger')
            return render_template('auth/login.html', providers=providers)

        # Reset failed attempts upon correct credentials
        reset_failed_login(user['id'])

        # Check if user needs mobile phone verification (Section 12, 13)
        if not user.get('phone_verified') or user.get('account_status') == 'PENDING_PHONE_VERIFICATION':
            session['pending_verification_user_id'] = user['id']
            session['pending_phone'] = user['phone_number']
            session['pending_channel'] = 'sms'
            
            # Dispatch fresh OTP if Twilio is configured
            if is_twilio_configured():
                send_otp(user['phone_number'], 'sms', purpose='LOGIN_PHONE_VERIFICATION')
                flash('Please complete phone verification to sign in.', 'info')
            else:
                flash('Phone verification is pending for your account.', 'warning')
                
            return redirect(url_for('auth.verify_phone_page'))

        # Successful local login: rotate session to prevent session fixation (Section 33)
        rotate_session(user)
        execute_db("UPDATE users SET last_login_at = NOW() WHERE id = %s", (user['id'],))
        log_auth_event(user['id'], 'LOGIN_SUCCESS', provider='local')

        target = get_safe_redirect(request.args.get('next'))
        flash(f"Welcome back, {user['name']}!", 'success')
        return redirect(target)

    return render_template('auth/login.html', providers=providers)

# ==========================================================
# 2. REGISTRATION (Sections 4, 5, 6, 12, 28)
# ==========================================================
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if 'user_id' in session and session.get('phone_verified'):
        return redirect(url_for('dashboard.index'))

    providers = get_providers_status()

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        username = request.form.get('username', '').strip()
        phone = request.form.get('phone', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        agree_terms = bool(request.form.get('agree_terms'))

        # Name check
        if not name or len(name) < 2:
            flash('Please enter your full name.', 'danger')
            return render_template('auth/register.html', providers=providers, **request.form)

        # Username validation
        is_valid_u, u_err = validate_username(username)
        if not is_valid_u:
            flash(u_err, 'danger')
            return render_template('auth/register.html', providers=providers, **request.form)

        norm_username = normalize_username(username)

        # Phone validation (E.164)
        is_valid_p, norm_phone, p_err = validate_phone_number(phone)
        if not is_valid_p:
            flash(p_err, 'danger')
            return render_template('auth/register.html', providers=providers, **request.form)

        # Email validation (optional or required)
        if email:
            is_valid_e, e_err = validate_email(email)
            if not is_valid_e:
                flash(e_err, 'danger')
                return render_template('auth/register.html', providers=providers, **request.form)

        # Password complexity
        is_valid_pw, pw_err = validate_password_complexity(password)
        if not is_valid_pw:
            flash(pw_err, 'danger')
            return render_template('auth/register.html', providers=providers, **request.form)

        if password != confirm_password:
            flash('Passwords do not match. Please re-type your password.', 'danger')
            return render_template('auth/register.html', providers=providers, **request.form)

        if not agree_terms:
            flash('You must agree to the Terms of Service & Privacy Policy to register.', 'danger')
            return render_template('auth/register.html', providers=providers, **request.form)

        # Uniqueness checks in database
        existing_u = query_db("SELECT id FROM users WHERE username_normalized = %s", (norm_username,), one=True)
        if existing_u:
            flash('That username is already taken. Please choose another.', 'danger')
            return render_template('auth/register.html', providers=providers, **request.form)

        existing_p = query_db("SELECT id FROM users WHERE phone_number = %s", (norm_phone,), one=True)
        if existing_p:
            flash('An account with this phone number already exists. Please sign in.', 'danger')
            return render_template('auth/register.html', providers=providers, **request.form)

        if email:
            existing_e = query_db("SELECT id FROM users WHERE email = %s", (email.lower(),), one=True)
            if existing_e:
                flash('An account with this email address already exists. Please sign in.', 'danger')
                return render_template('auth/register.html', providers=providers, **request.form)

        # Secure password hashing via Werkzeug pbkdf2:sha256
        pw_hash = hash_password(password)

        try:
            # Insert into users table
            user_id = execute_db("""
                INSERT INTO users (
                    username, username_normalized, name, email, phone_number,
                    password_hash, role, account_status, phone_verified, is_active
                ) VALUES (%s, %s, %s, %s, %s, %s, 'USER', 'PENDING_PHONE_VERIFICATION', 0, 1)
            """, (username, norm_username, name, email.lower() if email else None, norm_phone, pw_hash))

            # Insert into auth_identities (Section 23)
            execute_db("""
                INSERT INTO auth_identities (user_id, provider, provider_user_id, provider_email)
                VALUES (%s, 'local', %s, %s)
            """, (user_id, username, email.lower() if email else None))

            # Initialize empty patient profile
            execute_db("""
                INSERT INTO patient_profiles (user_id, phone) VALUES (%s, %s)
            """, (user_id, norm_phone))

            log_auth_event(user_id, 'REGISTER_LOCAL', provider='local')

            # Set verification session state
            session['pending_verification_user_id'] = user_id
            session['pending_phone'] = norm_phone
            session['pending_channel'] = 'sms'

            # Dispatch verification code via Twilio Verify if configured
            if is_twilio_configured():
                res = send_otp(norm_phone, 'sms', purpose='SIGNUP_PHONE_VERIFICATION')
                if res['success']:
                    flash(f"Verification code sent to {mask_phone_number(norm_phone)} via SMS.", 'success')
                else:
                    flash(res.get('error', 'Could not deliver SMS.'), 'warning')
            else:
                flash("Account registered! Phone verification service is currently in setup mode.", 'info')

            return redirect(url_for('auth.verify_phone_page'))

        except Exception as e:
            logger.error(f"Registration failure: {e}")
            flash('Registration could not be completed at this moment. Please try again.', 'danger')
            return render_template('auth/register.html', providers=providers, **request.form)

    return render_template('auth/register.html', providers=providers)

# ==========================================================
# 3. PHONE VERIFICATION & OTP (Sections 12, 13, 14, 15, 16)
# ==========================================================
@auth_bp.route('/verify-phone', methods=['GET', 'POST'])
def verify_phone_page():
    user_id = session.get('pending_verification_user_id') or session.get('user_id')
    if not user_id:
        flash('Please register or sign in to verify your phone number.', 'warning')
        return redirect(url_for('auth.login'))

    user = query_db("SELECT * FROM users WHERE id = %s", (user_id,), one=True)
    if not user:
        session.clear()
        return redirect(url_for('auth.login'))

    if user.get('phone_verified') and user.get('account_status') == 'ACTIVE':
        flash('Your phone number is already verified.', 'info')
        return redirect(url_for('dashboard.index'))

    phone = user.get('phone_number') or session.get('pending_phone', '')
    masked_phone = mask_phone_number(phone)
    channel = session.get('pending_channel', 'sms')
    whatsapp_available = is_whatsapp_configured()
    twilio_ready = is_twilio_configured()

    if request.method == 'POST':
        otp_code = (request.form.get('otp_code') or request.form.get('otp') or '').strip()
        if not otp_code or len(otp_code) != 6 or not otp_code.isdigit():
            flash('Please enter the complete 6-digit verification code.', 'danger')
            return render_template(
                'auth/verify_phone.html',
                phone=phone,
                masked_phone=masked_phone,
                channel=channel,
                whatsapp_available=whatsapp_available,
                twilio_ready=twilio_ready
            )

        # Verify against Twilio Verify API
        result = verify_otp(phone, otp_code, purpose='SIGNUP_PHONE_VERIFICATION')
        if result.get('success') and result.get('status') == 'approved':
            # Update user in MySQL: mark phone as verified and activate account
            execute_db("""
                UPDATE users SET
                    phone_verified = 1,
                    phone_verified_at = NOW(),
                    account_status = 'ACTIVE',
                    failed_login_attempts = 0,
                    locked_until = NULL
                WHERE id = %s
            """, (user['id'],))

            # Fetch fresh user object and rotate session
            refreshed_user = query_db("SELECT * FROM users WHERE id = %s", (user['id'],), one=True)
            rotate_session(refreshed_user)
            log_auth_event(user['id'], 'OTP_VERIFIED', provider='twilio')

            session.pop('pending_verification_user_id', None)
            session.pop('pending_phone', None)
            session.pop('pending_channel', None)

            flash('Mobile number verified successfully! Welcome to your secure health vault.', 'success')
            return redirect(url_for('dashboard.index'))
        else:
            err_msg = result.get('error', 'The verification code you entered is incorrect or expired.')
            flash(err_msg, 'danger')
            return render_template(
                'auth/verify_phone.html',
                phone=phone,
                masked_phone=masked_phone,
                channel=channel,
                whatsapp_available=whatsapp_available,
                twilio_ready=twilio_ready
            )

    return render_template(
        'auth/verify_phone.html',
        phone=phone,
        masked_phone=masked_phone,
        channel=channel,
        whatsapp_available=whatsapp_available,
        twilio_ready=twilio_ready
    )

@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    user_id = session.get('pending_verification_user_id') or session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Session expired. Please sign in.'}), 401

    user = query_db("SELECT phone_number FROM users WHERE id = %s", (user_id,), one=True)
    if not user or not user.get('phone_number'):
        return jsonify({'success': False, 'error': 'User phone number not found.'}), 404

    channel = request.form.get('channel', 'sms').lower()
    if channel == 'whatsapp' and not is_whatsapp_configured():
        return jsonify({
            'success': False,
            'error': 'WhatsApp verification is currently unavailable. Please choose SMS.'
        }), 400

    phone = user['phone_number']
    session['pending_channel'] = channel

    if not is_twilio_configured():
        return jsonify({
            'success': False,
            'configured': False,
            'error': 'Phone verification is not configured on this server.'
        }), 400

    res = send_otp(phone, channel=channel, purpose='RESEND_PHONE_VERIFICATION')
    if res.get('success'):
        log_auth_event(user_id, 'OTP_RESENT', provider='twilio')
        return jsonify({
            'success': True,
            'message': f"New verification code dispatched via {channel.upper()} to {mask_phone_number(phone)}."
        })
    else:
        return jsonify({'success': False, 'error': res.get('error', 'Failed to dispatch code.')}), 500

@auth_bp.route('/change-pending-phone', methods=['POST'])
def change_pending_phone():
    user_id = session.get('pending_verification_user_id') or session.get('user_id')
    if not user_id:
        flash('Session expired. Please sign in.', 'warning')
        return redirect(url_for('auth.login'))

    new_phone = request.form.get('new_phone', '').strip()
    is_valid, norm_phone, p_err = validate_phone_number(new_phone)
    if not is_valid:
        flash(p_err, 'danger')
        return redirect(url_for('auth.verify_phone_page'))

    # Check phone uniqueness
    existing = query_db("SELECT id FROM users WHERE phone_number = %s AND id != %s", (norm_phone, user_id), one=True)
    if existing:
        flash('This phone number is already registered to another account.', 'danger')
        return redirect(url_for('auth.verify_phone_page'))

    try:
        execute_db("UPDATE users SET phone_number = %s, phone_verified = 0 WHERE id = %s", (norm_phone, user_id))
        session['pending_phone'] = norm_phone
        log_auth_event(user_id, 'PHONE_CHANGED', provider='local')

        if is_twilio_configured():
            send_otp(norm_phone, 'sms', purpose='PHONE_CHANGE_VERIFICATION')
            flash(f"Phone updated to {mask_phone_number(norm_phone)}. A new OTP has been sent.", 'success')
        else:
            flash(f"Phone updated to {mask_phone_number(norm_phone)}.", 'info')

    except Exception as e:
        logger.error(f"Failed to update pending phone: {e}")
        flash('Unable to update phone number at this time.', 'danger')

    return redirect(url_for('auth.verify_phone_page'))

# ==========================================================
# 4. PASSWORD RESET (Section 49)
# ==========================================================
@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        identifier = request.form.get('identifier', '').strip()
        if not identifier:
            flash('Please enter your username, email, or phone number.', 'danger')
            return render_template('auth/forgot_password.html')

        norm_id = identifier.lower()
        user = query_db("""
            SELECT id, email, phone_number, name FROM users 
            WHERE username_normalized = %s OR email = %s OR phone_number = %s
        """, (norm_id, norm_id, identifier), one=True)

        if user:
            token = create_password_reset_token(user['id'])
            log_auth_event(user['id'], 'PASSWORD_RESET_REQUEST', provider='local')
            reset_url = request.host_url.rstrip('/') + url_for('auth.reset_password', token=token)
            return render_template('auth/forgot_password_done.html', reset_url=reset_url, user=user)

        # Generic safe response to prevent user enumeration
        flash('If an account exists with those credentials, reset instructions have been generated.', 'info')
        return render_template('auth/forgot_password.html')

    return render_template('auth/forgot_password.html')

@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    record = verify_password_reset_token(token)
    if not record:
        flash('This password reset link is invalid or has expired. Please request a new one.', 'danger')
        return redirect(url_for('auth.forgot_password'))

    if request.method == 'POST':
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        is_valid_pw, pw_err = validate_password_complexity(password)
        if not is_valid_pw:
            flash(pw_err, 'danger')
            return render_template('auth/reset_password.html', token=token)

        if password != confirm_password:
            flash('Passwords do not match. Please re-enter.', 'danger')
            return render_template('auth/reset_password.html', token=token)

        pw_hash = hash_password(password)
        success = consume_password_reset_token(token, pw_hash)
        if success:
            flash('Your password has been reset successfully! Please sign in.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('Unable to reset password. Please try again.', 'danger')
            return redirect(url_for('auth.forgot_password'))

    return render_template('auth/reset_password.html', token=token, username=record['username'])

# ==========================================================
# 5. LOGOUT (Section 34)
# ==========================================================
@auth_bp.route('/logout', methods=['GET', 'POST'])
def logout():
    user_id = session.get('user_id')
    token = session.get('session_token')
    if user_id and token:
        revoke_user_session(user_id, token)
        log_auth_event(user_id, 'LOGOUT', provider='local')

    session.clear()
    flash('You have been signed out safely.', 'info')
    return redirect(url_for('auth.login'))

@auth_bp.route('/security')
@auth_bp.route('/connected-accounts')
def connected_accounts():
    return redirect(url_for('settings.security_settings'))

