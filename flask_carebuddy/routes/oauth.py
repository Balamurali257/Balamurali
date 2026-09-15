import secrets
import logging
from flask import (
    Blueprint, request, redirect, url_for, session, flash, render_template, jsonify
)
from utils.db import query_db, execute_db
from utils.validators import (
    validate_username, normalize_username, validate_phone_number, get_safe_redirect
)
from utils.auth_helpers import rotate_session, login_required
from services.google_auth import (
    is_google_configured, get_google_auth_url, exchange_google_code, verify_google_id_token
)
from services.facebook_auth import (
    is_facebook_configured, get_facebook_auth_url, exchange_facebook_code
)
from services.apple_auth import (
    is_apple_configured, get_apple_auth_url, verify_apple_id_token
)
from services.twilio_verify import is_twilio_configured, send_otp, mask_phone_number
from services.security import log_auth_event, is_account_locked

logger = logging.getLogger('carebuddy.oauth')
oauth_bp = Blueprint('oauth', __name__)

def handle_oauth_identity_match(provider: str, sub: str, email: str | None, name: str | None):
    """
    Core account linking & resolution algorithm (Sections 23, 24, 25).
    - Checks auth_identities table for matching (provider, provider_user_id).
    - If found: sign in the user.
    - If not found:
      - If already authenticated: link identity to current account.
      - If new user: create user account and prompt for mobile phone verification.
    """
    # 1. Search for existing identity in auth_identities
    identity = query_db("""
        SELECT ai.*, u.username, u.name as user_name, u.phone_number, u.phone_verified,
               u.account_status, u.is_active, u.role, u.locked_until
        FROM auth_identities ai
        JOIN users u ON ai.user_id = u.id
        WHERE ai.provider = %s AND ai.provider_user_id = %s
    """, (provider, str(sub)), one=True)

    # A: User is already logged in (Account Linking flow)
    if 'user_id' in session:
        logged_in_uid = session['user_id']
        if identity:
            if identity['user_id'] == logged_in_uid:
                flash(f"Your {provider.capitalize()} account is already connected.", 'info')
            else:
                flash(f"This {provider.capitalize()} account is already linked to another CareBuddy user.", 'danger')
            return redirect(url_for('settings.security_settings'))

        # Link new identity
        try:
            execute_db("""
                INSERT INTO auth_identities (user_id, provider, provider_user_id, provider_email)
                VALUES (%s, %s, %s, %s)
            """, (logged_in_uid, provider, str(sub), email))
            log_auth_event(logged_in_uid, 'ACCOUNT_LINKED', provider=provider)
            flash(f"Successfully linked {provider.capitalize()} to your account.", 'success')
        except Exception as e:
            logger.error(f"Failed linking {provider} identity: {e}")
            flash(f"Could not link {provider.capitalize()} account.", 'danger')
        return redirect(url_for('settings.security_settings'))

    # B: Identity already recognized
    if identity:
        # Check lockout
        locked, lock_msg = is_account_locked(identity)
        if locked:
            flash(lock_msg, 'danger')
            return redirect(url_for('auth.login'))

        if not identity.get('is_active') or identity.get('account_status') in ('DISABLED', 'SUSPENDED'):
            flash('Your CareBuddy account has been disabled. Please contact support.', 'danger')
            return redirect(url_for('auth.login'))

        # Update last_login_at in identity and users
        execute_db("UPDATE auth_identities SET last_login_at = NOW() WHERE id = %s", (identity['id'],))
        execute_db("UPDATE users SET last_login_at = NOW() WHERE id = %s", (identity['user_id'],))

        # Check phone verification requirement
        if not identity.get('phone_verified') or identity.get('account_status') == 'PENDING_PHONE_VERIFICATION':
            session['pending_verification_user_id'] = identity['user_id']
            session['pending_phone'] = identity.get('phone_number', '')
            session['pending_channel'] = 'sms'
            flash('Please verify your mobile phone to complete sign-in.', 'info')
            return redirect(url_for('auth.verify_phone_page'))

        # Complete login
        user_record = query_db("SELECT * FROM users WHERE id = %s", (identity['user_id'],), one=True)
        rotate_session(user_record)
        log_auth_event(identity['user_id'], 'LOGIN_SUCCESS', provider=provider)
        flash(f"Signed in successfully with {provider.capitalize()}.", 'success')
        return redirect(url_for('dashboard.index'))

    # C: Brand new user via OAuth
    # Store temporary oauth payload in session for phone completion
    session['oauth_pending'] = {
        'provider': provider,
        'sub': str(sub),
        'email': email,
        'name': name or f"{provider.capitalize()} User"
    }
    return redirect(url_for('oauth.complete_social_profile'))

# ==========================================================
# COMPLETE PROFILE / PHONE LINKING (Section 12, 23, 24)
# ==========================================================
@oauth_bp.route('/complete-profile', methods=['GET', 'POST'])
def complete_social_profile():
    oauth_data = session.get('oauth_pending')
    if not oauth_data:
        flash('No pending social sign-in session found.', 'warning')
        return redirect(url_for('auth.login'))

    provider = oauth_data.get('provider', 'social')
    default_name = oauth_data.get('name', '')
    default_email = oauth_data.get('email', '')

    if request.method == 'POST':
        name = request.form.get('name', default_name).strip()
        username = request.form.get('username', '').strip()
        phone = request.form.get('phone', '').strip()

        if not name:
            flash('Please enter your full name.', 'danger')
            return render_template('auth/complete_profile.html', oauth_data=oauth_data)

        is_valid_u, u_err = validate_username(username)
        if not is_valid_u:
            flash(u_err, 'danger')
            return render_template('auth/complete_profile.html', oauth_data=oauth_data)

        norm_u = normalize_username(username)
        existing_u = query_db("SELECT id FROM users WHERE username_normalized = %s", (norm_u,), one=True)
        if existing_u:
            flash('This username is already taken. Please choose another.', 'danger')
            return render_template('auth/complete_profile.html', oauth_data=oauth_data)

        is_valid_p, norm_p, p_err = validate_phone_number(phone)
        if not is_valid_p:
            flash(p_err, 'danger')
            return render_template('auth/complete_profile.html', oauth_data=oauth_data)

        existing_p = query_db("SELECT id FROM users WHERE phone_number = %s", (norm_p,), one=True)
        if existing_p:
            flash('An account with this phone number already exists.', 'danger')
            return render_template('auth/complete_profile.html', oauth_data=oauth_data)

        try:
            # Create user
            user_id = execute_db("""
                INSERT INTO users (
                    username, username_normalized, name, email, phone_number,
                    role, account_status, phone_verified, is_active
                ) VALUES (%s, %s, %s, %s, %s, 'USER', 'PENDING_PHONE_VERIFICATION', 0, 1)
            """, (username, norm_u, name, default_email or None, norm_p))

            # Insert identity
            execute_db("""
                INSERT INTO auth_identities (user_id, provider, provider_user_id, provider_email)
                VALUES (%s, %s, %s, %s)
            """, (user_id, provider, oauth_data['sub'], default_email or None))

            # Initialize profile
            execute_db("INSERT INTO patient_profiles (user_id, phone) VALUES (%s, %s)", (user_id, norm_p))
            log_auth_event(user_id, 'REGISTER_OAUTH', provider=provider)

            # Cleanup session state
            session.pop('oauth_pending', None)
            session['pending_verification_user_id'] = user_id
            session['pending_phone'] = norm_p
            session['pending_channel'] = 'sms'

            if is_twilio_configured():
                send_otp(norm_p, 'sms', purpose='SIGNUP_PHONE_VERIFICATION')
                flash(f"Verification code sent to {mask_phone_number(norm_p)} via SMS.", 'success')
            else:
                flash("Account registered! Phone verification service is currently in setup mode.", 'info')

            return redirect(url_for('auth.verify_phone_page'))

        except Exception as e:
            logger.error(f"Failed to create OAuth user account: {e}")
            flash('Unable to complete account registration at this time.', 'danger')

    return render_template('auth/complete_profile.html', oauth_data=oauth_data)

# ==========================================================
# 1. GOOGLE IDENTITY ROUTES (Section 18, 19)
# ==========================================================
@oauth_bp.route('/auth/google')
def google_login():
    if not is_google_configured():
        flash('Google authentication is not configured on this server.', 'warning')
        return redirect(url_for('auth.login'))

    state = secrets.token_urlsafe(24)
    session['oauth_state'] = state
    redirect_uri = request.host_url.rstrip('/') + url_for('oauth.google_callback')
    auth_url = get_google_auth_url(state, redirect_uri)
    return redirect(auth_url)

@oauth_bp.route('/auth/google/callback')
def google_callback():
    state = request.args.get('state')
    expected_state = session.pop('oauth_state', None)
    if not state or state != expected_state:
        flash('Google authentication session expired or invalid state. Please try again.', 'danger')
        return redirect(url_for('auth.login'))

    code = request.args.get('code')
    if not code:
        flash('Google authorization code missing.', 'danger')
        return redirect(url_for('auth.login'))

    redirect_uri = request.host_url.rstrip('/') + url_for('oauth.google_callback')
    result = exchange_google_code(code, redirect_uri)
    if not result.get('success'):
        flash(result.get('error', 'Google authentication failed.'), 'danger')
        return redirect(url_for('auth.login'))

    return handle_oauth_identity_match(
        provider='google',
        sub=result['sub'],
        email=result.get('email'),
        name=result.get('name')
    )

@oauth_bp.route('/auth/google/credential', methods=['POST'])
def google_credential_post():
    """Endpoint for Google Identity Services One Tap / Button JS token postback."""
    credential = request.form.get('credential')
    if not credential:
        flash('Missing Google credential token.', 'danger')
        return redirect(url_for('auth.login'))

    result = verify_google_id_token(credential)
    if not result.get('success'):
        flash(result.get('error', 'Google identity token invalid.'), 'danger')
        return redirect(url_for('auth.login'))

    return handle_oauth_identity_match(
        provider='google',
        sub=result['sub'],
        email=result.get('email'),
        name=result.get('name')
    )

# ==========================================================
# 2. FACEBOOK LOGIN ROUTES (Section 20)
# ==========================================================
@oauth_bp.route('/auth/facebook')
def facebook_login():
    if not is_facebook_configured():
        flash('Facebook authentication is not configured on this server.', 'warning')
        return redirect(url_for('auth.login'))

    state = secrets.token_urlsafe(24)
    session['oauth_state'] = state
    redirect_uri = request.host_url.rstrip('/') + url_for('oauth.facebook_callback')
    auth_url = get_facebook_auth_url(state, redirect_uri)
    return redirect(auth_url)

@oauth_bp.route('/auth/facebook/callback')
def facebook_callback():
    state = request.args.get('state')
    expected_state = session.pop('oauth_state', None)
    if not state or state != expected_state:
        flash('Facebook authorization state mismatch. Please retry.', 'danger')
        return redirect(url_for('auth.login'))

    code = request.args.get('code')
    if not code:
        flash('Facebook did not return an authorization code.', 'danger')
        return redirect(url_for('auth.login'))

    redirect_uri = request.host_url.rstrip('/') + url_for('oauth.facebook_callback')
    result = exchange_facebook_code(code, redirect_uri)
    if not result.get('success'):
        flash(result.get('error', 'Facebook authentication failed.'), 'danger')
        return redirect(url_for('auth.login'))

    return handle_oauth_identity_match(
        provider='facebook',
        sub=result['sub'],
        email=result.get('email'),
        name=result.get('name')
    )

# ==========================================================
# 3. APPLE LOGIN ROUTES (Section 21, 22)
# ==========================================================
@oauth_bp.route('/auth/apple')
def apple_login():
    if not is_apple_configured():
        flash('Sign in with Apple is not configured on this server.', 'warning')
        return redirect(url_for('auth.login'))

    state = secrets.token_urlsafe(24)
    nonce = secrets.token_urlsafe(24)
    session['oauth_state'] = state
    session['oauth_nonce'] = nonce
    redirect_uri = request.host_url.rstrip('/') + url_for('oauth.apple_callback')
    auth_url = get_apple_auth_url(state, nonce, redirect_uri)
    return redirect(auth_url)

@oauth_bp.route('/auth/apple/callback', methods=['POST', 'GET'])
def apple_callback():
    """Handles Apple OAuth form_post callback."""
    state = request.form.get('state') or request.args.get('state')
    expected_state = session.pop('oauth_state', None)
    if not state or state != expected_state:
        flash('Apple authentication state mismatch. Please try again.', 'danger')
        return redirect(url_for('auth.login'))

    id_token_str = request.form.get('id_token')
    if not id_token_str:
        flash('Apple did not provide an identity token.', 'danger')
        return redirect(url_for('auth.login'))

    result = verify_apple_id_token(id_token_str)
    if not result.get('success'):
        flash(result.get('error', 'Apple identity token validation failed.'), 'danger')
        return redirect(url_for('auth.login'))

    return handle_oauth_identity_match(
        provider='apple',
        sub=result['sub'],
        email=result.get('email'),
        name="Apple User"
    )
