import logging
from flask import (
    Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
)
from utils.db import query_db, execute_db
from utils.auth_helpers import (
    login_required, hash_password, verify_password
)
from utils.validators import (
    validate_password_complexity, validate_phone_number
)
from services.security import (
    log_auth_event, get_user_active_sessions, revoke_user_session,
    revoke_all_sessions, hash_token
)
from services.twilio_verify import (
    is_twilio_configured, is_whatsapp_configured, send_otp, mask_phone_number
)
from services.google_auth import is_google_configured
from services.facebook_auth import is_facebook_configured
from services.apple_auth import is_apple_configured

logger = logging.getLogger('carebuddy.settings')
settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/settings/security')
@login_required
def security_settings():
    user_id = session['user_id']
    user = query_db("SELECT * FROM users WHERE id = %s", (user_id,), one=True)
    if not user:
        return redirect(url_for('auth.login'))

    # Query linked auth identities
    identities = query_db("""
        SELECT id, provider, provider_user_id, provider_email, created_at, last_login_at
        FROM auth_identities
        WHERE user_id = %s
    """, (user_id,))

    linked_providers = {row['provider']: row for row in identities}
    has_local_password = bool(user.get('password_hash'))

    # Active sessions
    active_sessions = get_user_active_sessions(user_id)
    current_token_hash = hash_token(session.get('session_token', ''))

    # Recent security audit events
    audit_events = query_db("""
        SELECT * FROM auth_events
        WHERE user_id = %s
        ORDER BY created_at DESC LIMIT 10
    """, (user_id,))

    providers_status = {
        'google': is_google_configured(),
        'facebook': is_facebook_configured(),
        'apple': is_apple_configured(),
        'twilio': is_twilio_configured(),
        'whatsapp': is_whatsapp_configured()
    }

    return render_template(
        'settings/security.html',
        user=user,
        masked_phone=mask_phone_number(user.get('phone_number', '')),
        linked_providers=linked_providers,
        has_local_password=has_local_password,
        active_sessions=active_sessions,
        current_token_hash=current_token_hash,
        audit_events=audit_events,
        providers_status=providers_status
    )

@settings_bp.route('/settings/change-password', methods=['POST'])
@login_required
def change_password():
    user_id = session['user_id']
    user = query_db("SELECT password_hash FROM users WHERE id = %s", (user_id,), one=True)
    
    current_password = request.form.get('current_password', '')
    new_password = request.form.get('new_password', '')
    confirm_password = request.form.get('confirm_password', '')

    # If user already had a password, verify current password
    if user.get('password_hash'):
        if not verify_password(user['password_hash'], current_password):
            flash('Your current password was entered incorrectly.', 'danger')
            return redirect(url_for('settings.security_settings'))

    is_valid_pw, pw_err = validate_password_complexity(new_password)
    if not is_valid_pw:
        flash(pw_err, 'danger')
        return redirect(url_for('settings.security_settings'))

    if new_password != confirm_password:
        flash('New passwords do not match. Please re-enter.', 'danger')
        return redirect(url_for('settings.security_settings'))

    new_hash = hash_password(new_password)
    try:
        execute_db("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, user_id))
        
        # Ensure 'local' identity is present in auth_identities
        existing_local = query_db("SELECT id FROM auth_identities WHERE user_id = %s AND provider = 'local'", (user_id,), one=True)
        if not existing_local:
            u_info = query_db("SELECT username, email FROM users WHERE id = %s", (user_id,), one=True)
            execute_db("""
                INSERT INTO auth_identities (user_id, provider, provider_user_id, provider_email)
                VALUES (%s, 'local', %s, %s)
            """, (user_id, u_info['username'], u_info['email']))

        # Revoke other sessions for security
        current_token = session.get('session_token')
        revoke_all_sessions(user_id, keep_current_token=current_token)

        log_auth_event(user_id, 'PASSWORD_CHANGED', provider='local')
        flash('Your password has been updated securely. Other devices have been logged out.', 'success')
    except Exception as e:
        logger.error(f"Failed changing password: {e}")
        flash('Could not update password at this time.', 'danger')

    return redirect(url_for('settings.security_settings'))

@settings_bp.route('/settings/unlink/<provider>', methods=['POST'])
@login_required
def unlink_provider(provider):
    """
    Safely unlinks external OAuth provider.
    Enforces that user retains at least one authentication method (password or another provider).
    """
    user_id = session['user_id']
    provider = provider.lower()
    if provider not in ('google', 'facebook', 'apple'):
        flash('Invalid provider specified.', 'danger')
        return redirect(url_for('settings.security_settings'))

    user = query_db("SELECT password_hash FROM users WHERE id = %s", (user_id,), one=True)
    has_password = bool(user.get('password_hash'))

    total_identities = query_db("SELECT provider FROM auth_identities WHERE user_id = %s", (user_id,))
    other_identities = [i['provider'] for i in total_identities if i['provider'] != provider]

    if not has_password and len(other_identities) == 0:
        flash(f'Cannot unlink {provider.capitalize()}. Please set an account password first so you can still log in.', 'warning')
        return redirect(url_for('settings.security_settings'))

    try:
        execute_db("DELETE FROM auth_identities WHERE user_id = %s AND provider = %s", (user_id, provider))
        log_auth_event(user_id, 'ACCOUNT_UNLINKED', provider=provider)
        flash(f'Unlinked {provider.capitalize()} successfully from your CareBuddy account.', 'info')
    except Exception as e:
        logger.error(f"Unlink error: {e}")
        flash(f'Could not unlink {provider.capitalize()}.', 'danger')

    return redirect(url_for('settings.security_settings'))

@settings_bp.route('/settings/sessions/<int:session_id>/revoke', methods=['POST'])
@login_required
def revoke_session_endpoint(session_id):
    user_id = session['user_id']
    try:
        execute_db("""
            UPDATE user_sessions SET revoked_at = NOW()
            WHERE id = %s AND user_id = %s
        """, (session_id, user_id))
        flash('Session revoked successfully.', 'info')
    except Exception as e:
        logger.error(f"Session revoke error: {e}")
        flash('Could not revoke session.', 'danger')

    return redirect(url_for('settings.security_settings'))

@settings_bp.route('/settings/sessions/revoke-all', methods=['POST'])
@login_required
def revoke_all_other_sessions():
    user_id = session['user_id']
    current_token = session.get('session_token')
    revoke_all_sessions(user_id, keep_current_token=current_token)
    flash('All other active sessions have been logged out.', 'success')
    return redirect(url_for('settings.security_settings'))
