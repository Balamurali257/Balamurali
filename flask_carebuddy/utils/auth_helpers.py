import secrets
import logging
from functools import wraps
from flask import session, redirect, url_for, flash, abort
from werkzeug.security import generate_password_hash, check_password_hash
from utils.db import execute_db, query_db
from services.security import register_user_session, revoke_user_session

logger = logging.getLogger('carebuddy.auth_helpers')

# ==========================================================
# 1. WERKZEUG PASSWORD HASHING (Section 6, 30)
# ==========================================================

def hash_password(password: str) -> str:
    """Generates secure Werkzeug password hash using pbkdf2:sha256."""
    return generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)

def verify_password(stored_hash: str, password: str) -> bool:
    """Verifies plaintext password against secure Werkzeug hash."""
    if not stored_hash or not password:
        return False
    try:
        return check_password_hash(stored_hash, password)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

# ==========================================================
# 2. SESSION LIFECYCLE & ROTATION (Section 33, 34)
# ==========================================================

def rotate_session(user: dict):
    """
    Prevents session fixation attacks by clearing the current session ID,
    generating a fresh cryptographically random session identifier,
    and recording the session in user_sessions (Section 33, 34).
    """
    old_session_token = session.get('session_token')
    if old_session_token and 'user_id' in session:
        revoke_user_session(session['user_id'], old_session_token)

    session.clear()
    
    # Generate new random session token
    new_token = secrets.token_urlsafe(32)
    session['session_token'] = new_token
    session['user_id'] = user['id']
    session['username'] = user['username']
    session['name'] = user['name']
    session['role'] = user.get('role', 'USER')
    session['phone_verified'] = bool(user.get('phone_verified'))
    session.permanent = True

    # Register in user_sessions table
    register_user_session(user['id'], new_token)

def get_current_user() -> dict | None:
    """
    Returns the authenticated user dict from the database or None.
    Never trusts client-provided identity data.
    """
    user_id = session.get('user_id')
    if not user_id:
        return None
    return query_db("SELECT * FROM users WHERE id = %s", (user_id,), one=True)

# ==========================================================
# 3. ACCESS CONTROL DECORATORS (Sections 31, 32, 33)
# ==========================================================

def login_required(f):
    """
    Ensures user is logged in.
    Redirects unverified users to phone verification screen.
    Blocks locked or disabled accounts.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please sign in to access your CareBuddy health vault.', 'warning')
            return redirect(url_for('auth.login'))
            
        user = query_db(
            "SELECT id, phone_verified, account_status, is_active FROM users WHERE id = %s", 
            (session['user_id'],), 
            one=True
        )
        if not user or not user.get('is_active'):
            session.clear()
            flash('Your session has expired or account is inactive.', 'warning')
            return redirect(url_for('auth.login'))
            
        if user.get('account_status') in ('LOCKED', 'SUSPENDED', 'DEACTIVATED'):
            session.clear()
            flash('Your account has been locked or suspended. Please contact support.', 'danger')
            return redirect(url_for('auth.login'))

        if user.get('account_status') == 'PENDING_PHONE_VERIFICATION' or not user.get('phone_verified'):
            session['pending_verification_user_id'] = user['id']
            flash('Please verify your mobile phone number to activate your account.', 'info')
            return redirect(url_for('auth.verify_phone_page'))
            
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """
    Enforces administrator role strictly from the database server-side (Section 33).
    Social logins cannot automatically grant ADMIN role.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please sign in with administrator credentials.', 'warning')
            return redirect(url_for('auth.login'))
            
        user = query_db("SELECT role, account_status, is_active FROM users WHERE id = %s", (session['user_id'],), one=True)
        if not user or user.get('role') != 'ADMIN' or user.get('account_status') != 'ACTIVE' or not user.get('is_active'):
            flash('Access denied. Administrator privileges required.', 'danger')
            return redirect(url_for('dashboard.index'))
            
        return f(*args, **kwargs)
    return decorated_function

def phone_verified_required(f):
    """
    Ensures user has successfully completed phone verification (Section 7).
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return redirect(url_for('auth.login'))
        user = query_db("SELECT phone_verified FROM users WHERE id = %s", (user_id,), one=True)
        if not user or not user.get('phone_verified'):
            flash('This action requires verified mobile phone security.', 'warning')
            return redirect(url_for('auth.verify_phone_page'))
        return f(*args, **kwargs)
    return decorated_function

def require_report_owner(report_id: int, user_id: int) -> dict:
    """
    Strictly verifies medical document ownership (Section 32).
    Prevents IDOR attacks. Returns the report or aborts with 404.
    """
    report = query_db(
        "SELECT * FROM medical_reports WHERE id = %s AND user_id = %s",
        (report_id, user_id),
        one=True
    )
    if not report:
        abort(404)
    return report
