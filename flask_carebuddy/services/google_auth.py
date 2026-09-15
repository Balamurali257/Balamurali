import logging
import requests
from config import Config

logger = logging.getLogger('carebuddy.google_auth')

def is_google_configured() -> bool:
    """
    Checks if Google OAuth credentials are configured.
    """
    cid = Config.GOOGLE_CLIENT_ID or ''
    secret = Config.GOOGLE_CLIENT_SECRET or ''
    if not Config.GOOGLE_AUTH_ENABLED:
        return False
    if not cid or not secret:
        return False
    if 'your_' in cid or cid.startswith('google-client-id'):
        return False
    return True

def get_google_auth_url(state: str, redirect_uri: str) -> str:
    """
    Generates standard Google OAuth 2.0 authorization URL.
    """
    base = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        'client_id': Config.GOOGLE_CLIENT_ID,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': state,
        'access_type': 'online',
        'prompt': 'select_account'
    }
    query = '&'.join(f"{k}={requests.utils.quote(str(v))}" for k, v in params.items())
    return f"{base}?{query}"

def exchange_google_code(code: str, redirect_uri: str) -> dict:
    """
    Exchanges authorization code for Google tokens, then validates ID token.
    Extracts stable provider user ID ('sub') as specified in Section 18.
    """
    if not is_google_configured():
        return {
            'success': False,
            'error': "Google authentication is not configured on this server."
        }

    token_url = "https://oauth2.googleapis.com/token"
    try:
        resp = requests.post(token_url, data={
            'code': code,
            'client_id': Config.GOOGLE_CLIENT_ID,
            'client_secret': Config.GOOGLE_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }, timeout=10)
        
        token_data = resp.json()
        if 'error' in token_data:
            logger.error(f"Google token error: {token_data}")
            return {
                'success': False,
                'error': f"Google authorization failed: {token_data.get('error_description', token_data['error'])}"
            }
            
        id_token_str = token_data.get('id_token')
        if not id_token_str:
            return {
                'success': False,
                'error': "Google did not return an identity token."
            }
            
        return verify_google_id_token(id_token_str)
    except Exception as e:
        logger.error(f"Google code exchange failed: {e}")
        return {
            'success': False,
            'error': "Failed to connect to Google authentication service."
        }

def verify_google_id_token(id_token_str: str) -> dict:
    """
    Validates Google ID Token server-side and extracts user profile.
    Uses Google 'sub' as stable identifier.
    """
    if not is_google_configured():
        return {
            'success': False,
            'error': "Google authentication is not configured on this server."
        }

    # Attempt 1: Using google-auth SDK if installed
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        
        req = google_requests.Request()
        id_info = id_token.verify_oauth2_token(
            id_token_str,
            req,
            Config.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )
        
        if id_info.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
            return {'success': False, 'error': 'Invalid Google token issuer.'}
            
        return {
            'success': True,
            'provider': 'google',
            'sub': id_info['sub'],
            'email': id_info.get('email'),
            'email_verified': id_info.get('email_verified', False),
            'name': id_info.get('name', 'Google User'),
            'picture': id_info.get('picture')
        }
    except Exception as sdk_err:
        logger.warning(f"google-auth SDK verify failed: {sdk_err}; falling back to TokenInfo endpoint.")

    # Attempt 2: Direct Google TokenInfo endpoint verification
    try:
        resp = requests.get(
            'https://oauth2.googleapis.com/tokeninfo',
            params={'id_token': id_token_str},
            timeout=8
        )
        if resp.status_code == 200:
            data = resp.json()
            if Config.GOOGLE_CLIENT_ID and data.get('aud') != Config.GOOGLE_CLIENT_ID:
                return {'success': False, 'error': 'Google token audience mismatch.'}
                
            return {
                'success': True,
                'provider': 'google',
                'sub': data['sub'],
                'email': data.get('email'),
                'email_verified': data.get('email_verified') in ('true', True),
                'name': data.get('name', 'Google User'),
                'picture': data.get('picture')
            }
        return {
            'success': False,
            'error': "Google token verification rejected by provider."
        }
    except Exception as net_err:
        logger.error(f"Google tokeninfo endpoint error: {net_err}")
        return {
            'success': False,
            'error': "Unable to verify Google credential with authentication server."
        }
