import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from flask import request
from utils.db import execute_db, query_db
from config import Config

logger = logging.getLogger('carebuddy.security')

# ==========================================================
# 1. STRUCTURED AUDIT EVENT LOGGING (Sections 27, 37, 72)
# ==========================================================

def log_auth_event(
    user_id: int | None,
    event_type: str,
    provider: str = 'local',
    success: bool = True,
    failure_reason: str | None = None
):
    """
    Logs structured authentication and security audit events.
    Stored in `auth_events` and mirrored to `activity_logs`.
    Never stores plaintext passwords, raw OTP codes, or tokens.
    """
    try:
        ip = request.headers.get('X-Forwarded-For', request.remote_addr or '')
        if ',' in ip:
            ip = ip.split(',')[0].strip()
        user_agent = request.headers.get('User-Agent', '')[:250]
        safe_reason = str(failure_reason)[:250] if failure_reason else None

        # Insert into auth_events
        execute_db("""
            INSERT INTO auth_events (user_id, event_type, provider, ip_address, user_agent, success, failure_reason)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, event_type, provider, ip[:45], user_agent, success, safe_reason))

        # Mirror important user-facing security events into activity_logs
        if user_id and success:
            activity_desc = {
                'LOGIN_SUCCESS': f"Signed in successfully via {provider.capitalize()}",
                'LOGOUT': "Signed out of session",
                'REGISTER_LOCAL': "Created new CareBuddy account",
                'REGISTER_OAUTH': f"Registered with {provider.capitalize()}",
                'OTP_VERIFIED': "Successfully verified mobile phone number",
                'PASSWORD_CHANGED': "Updated account password",
                'PASSWORD_RESET_COMPLETE': "Reset account password via secure token",
                'ACCOUNT_LINKED': f"Linked external {provider.capitalize()} login identity",
                'ACCOUNT_UNLINKED': f"Unlinked {provider.capitalize()} login identity",
                'PHONE_CHANGED': "Updated and verified new mobile phone number"
            }.get(event_type, f"Security event: {event_type}")

            execute_db("""
                INSERT INTO activity_logs (user_id, action_type, description)
                VALUES (%s, %s, %s)
            """, (user_id, event_type, activity_desc))

    except Exception as e:
        logger.error(f"Failed to record auth audit event {event_type}: {e}")

# ==========================================================
# 2. ACCOUNT LOCKOUT & FAILED ATTEMPT MANAGEMENT (Section 38, 39)
# ==========================================================

def is_account_locked(user: dict) -> tuple[bool, str]:
    """
    Checks if account is locked due to excessive failed attempts.
    Returns (is_locked, message).
    """
    if not user:
        return False, ""
        
    locked_until = user.get('locked_until')
    if locked_until:
        if isinstance(locked_until, str):
            try:
                locked_until = datetime.strptime(locked_until, "%Y-%m-%d %H:%M:%S")
            except Exception:
                locked_until = None
                
        if locked_until and datetime.now() < locked_until:
            diff_mins = max(1, int((locked_until - datetime.now()).total_seconds() / 60))
            return True, f"This account is temporarily locked due to multiple failed login attempts. Please try again in {diff_mins} minute(s)."

    if user.get('account_status') == 'LOCKED':
        return True, "This account is currently locked. Please contact support or reset your password."

    return False, ""

def record_failed_login(user_id: int):
    """
    Increments failed login counter. If threshold exceeded, locks account for 15 minutes.
    """
    try:
        user = query_db("SELECT id, failed_login_attempts FROM users WHERE id = %s", (user_id,), one=True)
        if not user:
            return

        attempts = (user.get('failed_login_attempts') or 0) + 1
        max_attempts = Config.MAX_FAILED_LOGIN_ATTEMPTS
        lockout_mins = Config.ACCOUNT_LOCKOUT_MINUTES

        if attempts >= max_attempts:
            locked_until = datetime.now() + timedelta(minutes=lockout_mins)
            execute_db("""
                UPDATE users 
                SET failed_login_attempts = %s, locked_until = %s, account_status = 'LOCKED'
                WHERE id = %s
            """, (attempts, locked_until, user_id))
            log_auth_event(user_id, 'ACCOUNT_LOCKED', success=False, failure_reason=f"Exceeded {max_attempts} failed attempts")
        else:
            execute_db("UPDATE users SET failed_login_attempts = %s WHERE id = %s", (attempts, user_id))
    except Exception as e:
        logger.error(f"Error updating failed login attempts for user {user_id}: {e}")

def reset_failed_login(user_id: int):
    """
    Resets failed login counter and clears temporary lockout.
    """
    try:
        execute_db("""
            UPDATE users 
            SET failed_login_attempts = 0, locked_until = NULL, 
                account_status = IF(account_status = 'LOCKED', 'ACTIVE', account_status)
            WHERE id = %s
        """, (user_id,))
    except Exception as e:
        logger.error(f"Error resetting failed login count: {e}")

# ==========================================================
# 3. ACTIVE SESSIONS MANAGEMENT (Section 36)
# ==========================================================

def hash_token(token: str) -> str:
    """Generates SHA-256 hash of a session or reset token."""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def register_user_session(user_id: int, session_id: str):
    """
    Stores SHA-256 hashed session token into user_sessions table.
    """
    try:
        token_hash = hash_token(session_id)
        ip = request.headers.get('X-Forwarded-For', request.remote_addr or '')
        if ',' in ip:
            ip = ip.split(',')[0].strip()
        user_agent = request.headers.get('User-Agent', 'Web Browser')[:250]
        expires_at = datetime.now() + timedelta(days=7)

        execute_db("""
            INSERT INTO user_sessions (user_id, session_token_hash, device_info, ip_address, expires_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, token_hash, user_agent, ip[:45], expires_at))
    except Exception as e:
        logger.error(f"Error registering user session: {e}")

def revoke_user_session(user_id: int, session_id: str):
    """
    Marks a session as revoked.
    """
    try:
        token_hash = hash_token(session_id)
        execute_db("""
            UPDATE user_sessions SET revoked_at = NOW() 
            WHERE user_id = %s AND session_token_hash = %s
        """, (user_id, token_hash))
    except Exception as e:
        logger.error(f"Error revoking user session: {e}")

def revoke_all_sessions(user_id: int, keep_current_token: str | None = None):
    """
    Revokes all sessions for user (e.g. after password change).
    """
    try:
        if keep_current_token:
            current_hash = hash_token(keep_current_token)
            execute_db("""
                UPDATE user_sessions SET revoked_at = NOW()
                WHERE user_id = %s AND session_token_hash != %s AND revoked_at IS NULL
            """, (user_id, current_hash))
        else:
            execute_db("""
                UPDATE user_sessions SET revoked_at = NOW()
                WHERE user_id = %s AND revoked_at IS NULL
            """, (user_id,))
    except Exception as e:
        logger.error(f"Error revoking all user sessions: {e}")

def get_user_active_sessions(user_id: int) -> list:
    """
    Retrieves list of active, non-revoked sessions for security settings page.
    """
    try:
        return query_db("""
            SELECT id, device_info, ip_address, created_at, last_seen_at
            FROM user_sessions
            WHERE user_id = %s AND revoked_at IS NULL AND expires_at > NOW()
            ORDER BY last_seen_at DESC LIMIT 10
        """, (user_id,)) or []
    except Exception as e:
        logger.error(f"Error querying active sessions: {e}")
        return []

# ==========================================================
# 4. PASSWORD RESET TOKEN LIFECYCLE (Section 49)
# ==========================================================

def create_password_reset_token(user_id: int) -> str:
    """
    Generates a secure cryptographic random token for password reset.
    Stores the SHA-256 hash in database with 1-hour expiration.
    Returns the unhashed plaintext token for the single-use reset URL.
    """
    plain_token = secrets.token_urlsafe(32)
    token_h = hash_token(plain_token)
    expires_at = datetime.now() + timedelta(hours=1)

    # Invalidate previous unused reset tokens for this user
    execute_db("DELETE FROM password_resets WHERE user_id = %s AND used_at IS NULL", (user_id,))

    execute_db("""
        INSERT INTO password_resets (user_id, token_hash, expires_at)
        VALUES (%s, %s, %s)
    """, (user_id, token_h, expires_at))

    return plain_token

def verify_password_reset_token(plain_token: str) -> dict | None:
    """
    Validates password reset token hash and verifies it is unexpired and unused.
    Returns the reset record if valid, None otherwise.
    """
    if not plain_token:
        return None

    token_h = hash_token(plain_token)
    record = query_db("""
        SELECT pr.*, u.username, u.email, u.name
        FROM password_resets pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.token_hash = %s AND pr.used_at IS NULL AND pr.expires_at > NOW()
    """, (token_h,), one=True)

    return record

def consume_password_reset_token(plain_token: str, new_password_hash: str) -> bool:
    """
    Consumes password reset token, updates user password, unlocks account,
    and revokes all active user sessions.
    """
    record = verify_password_reset_token(plain_token)
    if not record:
        return False

    user_id = record['user_id']
    try:
        # Mark token as used
        execute_db("UPDATE password_resets SET used_at = NOW() WHERE id = %s", (record['id'],))
        # Update user password, clear failed attempts and unlock account
        execute_db("""
            UPDATE users SET
                password_hash = %s,
                failed_login_attempts = 0,
                locked_until = NULL,
                account_status = IF(account_status = 'LOCKED', 'ACTIVE', account_status)
            WHERE id = %s
        """, (new_password_hash, user_id))

        # Revoke all existing sessions for security
        revoke_all_sessions(user_id)
        log_auth_event(user_id, 'PASSWORD_RESET_COMPLETE', success=True)
        return True
    except Exception as e:
        logger.error(f"Error consuming password reset token: {e}")
        return False
