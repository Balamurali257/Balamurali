import logging
import requests
from config import Config

logger = logging.getLogger('carebuddy.facebook_auth')

def is_facebook_configured() -> bool:
    """Checks if Facebook App credentials are configured."""
    app_id = Config.FACEBOOK_APP_ID or ''
    secret = Config.FACEBOOK_APP_SECRET or ''
    if not Config.FACEBOOK_AUTH_ENABLED:
        return False
    if not app_id or not secret:
        return False
    if 'your_' in app_id or app_id.startswith('fb-app-id'):
        return False
    return True

def get_facebook_auth_url(state: str, redirect_uri: str) -> str:
    """Generates standard Facebook OAuth authorization dialog URL."""
    base = "https://www.facebook.com/v19.0/dialog/oauth"
    params = {
        'client_id': Config.FACEBOOK_APP_ID,
        'redirect_uri': redirect_uri,
        'state': state,
        'scope': 'email,public_profile',
        'response_type': 'code'
    }
    query = '&'.join(f"{k}={requests.utils.quote(str(v))}" for k, v in params.items())
    return f"{base}?{query}"

def exchange_facebook_code(code: str, redirect_uri: str) -> dict:
    """
    Exchanges Facebook OAuth authorization code for an access token,
    then fetches the stable Facebook user ID ('id'), name, and email (Section 20).
    """
    if not is_facebook_configured():
        return {
            'success': False,
            'error': "Facebook authentication is not configured on this server."
        }

    try:
        # Step 1: Exchange code for access token
        token_url = "https://graph.facebook.com/v19.0/oauth/access_token"
        token_resp = requests.get(token_url, params={
            'client_id': Config.FACEBOOK_APP_ID,
            'client_secret': Config.FACEBOOK_APP_SECRET,
            'redirect_uri': redirect_uri,
            'code': code
        }, timeout=10)
        
        token_data = token_resp.json()
        if 'error' in token_data:
            err_msg = token_data['error'].get('message', 'Facebook authorization failed.')
            logger.error(f"Facebook token error: {err_msg}")
            return {'success': False, 'error': f"Facebook error: {err_msg}"}
            
        access_token = token_data.get('access_token')
        if not access_token:
            return {'success': False, 'error': 'No access token received from Facebook.'}

        # Step 2: Fetch user profile (stable user ID)
        user_url = "https://graph.facebook.com/me"
        user_resp = requests.get(user_url, params={
            'fields': 'id,name,email,picture.type(large)',
            'access_token': access_token
        }, timeout=10)
        
        user_data = user_resp.json()
        if 'error' in user_data:
            err_msg = user_data['error'].get('message', 'Failed to retrieve Facebook profile.')
            return {'success': False, 'error': err_msg}

        # Validate stable Facebook ID exists
        fb_id = user_data.get('id')
        if not fb_id:
            return {'success': False, 'error': 'Facebook did not return a valid user identity.'}

        return {
            'success': True,
            'provider': 'facebook',
            'sub': str(fb_id),
            'email': user_data.get('email'),
            'name': user_data.get('name', 'Facebook User'),
            'picture': user_data.get('picture', {}).get('data', {}).get('url')
        }
    except Exception as e:
        logger.error(f"Facebook authentication exchange error: {e}")
        return {
            'success': False,
            'error': "Unable to communicate with Facebook authentication servers."
        }
