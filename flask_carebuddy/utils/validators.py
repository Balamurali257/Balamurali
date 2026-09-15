import re
from urllib.parse import urlparse, urljoin
from flask import request, url_for

# ==========================================================
# USERNAME VALIDATION (Section 4, 28)
# ==========================================================

def validate_username(username: str) -> tuple[bool, str]:
    """
    Validates username rules:
    - 3 to 30 characters long
    - Allowed characters: Letters, numbers, underscores
    - No spaces or special symbols
    """
    if not username:
        return False, "Username is required."
        
    u = username.strip()
    if len(u) < 3 or len(u) > 30:
        return False, "Username must be between 3 and 30 characters long."
        
    if not re.match(r'^[A-Za-z0-9_]+$', u):
        return False, "Username can only contain letters, numbers, and underscores (no spaces)."
        
    return True, ""

def normalize_username(username: str) -> str:
    """
    Normalizes username to lowercase for case-insensitive uniqueness.
    """
    return username.strip().lower() if username else ""

# ==========================================================
# PHONE NUMBER VALIDATION & E.164 NORMALIZATION (Section 5, 29)
# ==========================================================

def validate_phone_number(phone: str) -> tuple[bool, str, str]:
    """
    Validates and normalizes phone number according to international E.164:
    - Starts with '+'
    - Followed by country code and national digits (7 to 15 digits total)
    Returns: (is_valid, normalized_phone, error_message)
    """
    if not phone:
        return False, "", "Phone number is required."

    # Remove all spaces, dashes, parentheses
    clean = re.sub(r'[\s\-\(\)\.]', '', phone.strip())

    # Ensure leading '+'
    if not clean.startswith('+'):
        # If user entered 10-digit number without country code, prompt for standard format
        return False, "", "Phone number must include '+' followed by your country code (e.g. +919876543210 or +14155552671)."

    digits = clean[1:]
    if not digits.isdigit():
        return False, "", "Phone number may only contain digits following the '+' prefix."

    if len(digits) < 7 or len(digits) > 15:
        return False, "", "Phone number must contain between 7 and 15 digits (including country code)."

    return True, clean, ""

# ==========================================================
# PASSWORD COMPLEXITY (Section 6, 30)
# ==========================================================

def validate_password_complexity(password: str) -> tuple[bool, str]:
    """
    Enforces strong password rules:
    - At least 8 characters
    - At least one uppercase letter (A-Z)
    - At least one lowercase letter (a-z)
    - At least one digit (0-9)
    - At least one special symbol (!@#$%^&*...)
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."

    if not re.search(r'[A-Z]', password):
        return False, "Password must include at least one uppercase letter (A-Z)."

    if not re.search(r'[a-z]', password):
        return False, "Password must include at least one lowercase letter (a-z)."

    if not re.search(r'[0-9]', password):
        return False, "Password must include at least one number (0-9)."

    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]', password):
        return False, "Password must include at least one special character (e.g. !@#$%^&*)."

    return True, ""

# ==========================================================
# EMAIL VALIDATION
# ==========================================================

def validate_email(email: str) -> tuple[bool, str]:
    """Validates standard email format."""
    if not email:
        return False, "Email address is required."
    e = email.strip().lower()
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_regex, e):
        return False, "Please enter a valid email address."
    return True, ""

# ==========================================================
# SAFE REDIRECT / OPEN REDIRECT DEFENSE (Section 31)
# ==========================================================

def get_safe_redirect(target_url: str | None, default_endpoint: str = 'dashboard.index') -> str:
    """
    Validates redirect targets to prevent open redirect vulnerabilities.
    Rejects external schemes (http://, https://) and protocol-relative URLs (//evil.com).
    """
    if not target_url:
        return url_for(default_endpoint)

    target_url = target_url.strip()
    
    # Check for protocol-relative URLs or javascript URLs
    if target_url.startswith('//') or target_url.startswith('\\\\') or 'javascript:' in target_url.lower():
        return url_for(default_endpoint)

    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target_url))

    if test_url.scheme in ('http', 'https') and ref_url.netloc == test_url.netloc:
        return target_url

    return url_for(default_endpoint)
