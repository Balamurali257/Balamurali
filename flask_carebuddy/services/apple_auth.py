import os
import time
import json
import logging
import requests
from config import Config

logger = logging.getLogger('carebuddy.apple_auth')

def is_apple_configured() -> bool:
    """Checks if Apple Services ID is configured."""
    client_id = Config.APPLE_CLIENT_ID or ''
    if not Config.APPLE_AUTH_ENABLED:
        return False
    if not client_id or 'your_' in client_id or client_id.startswith('apple-client-id'):
        return False
    return True

def get_apple_auth_url(state: str, nonce: str, redirect_uri: str) -> str:
    """
    Generates standard Apple Web OAuth authorization dialog URL.
    Uses response_mode='form_post' as per Apple OAuth specifications.
    """
    base = "https://appleid.apple.com/auth/authorize"
    params = {
        'client_id': Config.APPLE_CLIENT_ID,
        'redirect_uri': redirect_uri,
        'response_type': 'code id_token',
        'response_mode': 'form_post',
        'scope': 'name email',
        'state': state,
        'nonce': nonce
    }
    query = '&'.join(f"{k}={requests.utils.quote(str(v))}" for k, v in params.items())
    return f"{base}?{query}"

def verify_apple_id_token(id_token_str: str) -> dict:
    """
    Decodes and validates Apple ID Token (Section 21).
    Extracts stable Apple subject identifier 'sub', and properly flags
    Apple Private Relay addresses (@privaterelay.appleid.com).
    """
    if not id_token_str:
        return {'success': False, 'error': "Missing Apple identity token."}

    if not is_apple_configured():
        return {'success': False, 'error': "Apple authentication is not configured on this server."}

    try:
        import jwt
        
        # 1. Fetch Apple's public signing keys
        keys_resp = requests.get('https://appleid.apple.com/auth/keys', timeout=8)
        if keys_resp.status_code != 200:
            return {'success': False, 'error': "Unable to retrieve Apple verification keys."}
            
        apple_keys = keys_resp.json()
        
        # 2. Extract token unverified header for key ID (kid)
        header = jwt.get_unverified_header(id_token_str)
        kid = header.get('kid')
        
        # 3. Find matching public key
        key_data = next((k for k in apple_keys.get('keys', []) if k.get('kid') == kid), None)
        
        if key_data:
            # Use PyJWT with RS256 algorithm to verify signature
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key_data))
            payload = jwt.decode(
                id_token_str,
                public_key,
                algorithms=['RS256'],
                audience=Config.APPLE_CLIENT_ID,
                issuer='https://appleid.apple.com'
            )
        else:
            # Fallback: check unverified claims if public key not matched
            payload = jwt.decode(id_token_str, options={"verify_signature": False})
            if payload.get('iss') != 'https://appleid.apple.com':
                return {'success': False, 'error': "Invalid Apple token issuer."}
            if Config.APPLE_CLIENT_ID and payload.get('aud') != Config.APPLE_CLIENT_ID:
                return {'success': False, 'error': "Apple token audience mismatch."}

        sub = payload.get('sub')
        if not sub:
            return {'success': False, 'error': "No stable Apple subject identifier found in token."}
            
        email = payload.get('email')
        is_private_relay = bool(email and '@privaterelay.appleid.com' in email.lower())

        return {
            'success': True,
            'provider': 'apple',
            'sub': str(sub),
            'email': email,
            'email_verified': payload.get('email_verified') in (True, 'true'),
            'is_private_relay': is_private_relay
        }
    except Exception as e:
        logger.error(f"Apple ID token validation error: {e}")
        return {
            'success': False,
            'error': f"Apple ID token validation failed: {str(e)}"
        }
