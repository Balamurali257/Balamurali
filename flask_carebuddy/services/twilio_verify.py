import logging
from config import Config

logger = logging.getLogger('carebuddy.twilio')

def mask_phone_number(phone: str) -> str:
    """
    Masks phone numbers to protect user privacy (Sections 12, 61).
    Example: +919876543210 -> +91 ******3210
             +14155552671 -> +1 ******2671
    """
    if not phone:
        return ""
    clean = phone.strip()
    if len(clean) <= 6:
        return clean
    prefix = clean[:3] if clean.startswith('+') else clean[:2]
    suffix = clean[-4:]
    return f"{prefix} ******{suffix}"

def is_twilio_configured() -> bool:
    """
    Checks if Twilio Verify credentials are validly supplied.
    Returns False if placeholders or empty.
    """
    sid = Config.TWILIO_ACCOUNT_SID or ''
    token = Config.TWILIO_AUTH_TOKEN or ''
    service = Config.TWILIO_VERIFY_SERVICE_SID or ''
    
    if not Config.TWILIO_ENABLED:
        return False
    if not sid or not token or not service:
        return False
    if sid.startswith('ACxxx') or service.startswith('VAxxx') or 'your_' in token:
        return False
    return True

def is_whatsapp_configured() -> bool:
    """
    Returns True only if Twilio is configured AND WhatsApp sender is enabled (Section 15).
    """
    return is_twilio_configured() and Config.TWILIO_WHATSAPP_ENABLED

def send_otp(phone_number: str, channel: str = 'sms', purpose: str = 'SIGNUP_PHONE_VERIFICATION') -> dict:
    """
    Dispatches an OTP using Twilio Verify API (Section 13, 14, 15).
    Strictly avoids faking success if unconfigured.
    Never logs or exposes the OTP code itself.
    """
    channel = channel.lower()
    if channel not in ('sms', 'whatsapp'):
        channel = 'sms'

    # Check WhatsApp availability
    if channel == 'whatsapp' and not is_whatsapp_configured():
        return {
            'success': False,
            'configured': False,
            'channel': channel,
            'error': "WhatsApp verification is currently unavailable. Please choose SMS."
        }

    # Verify Twilio configuration
    if not is_twilio_configured():
        logger.warning(f"Twilio Verify called for purpose '{purpose}' but credentials are not configured.")
        return {
            'success': False,
            'configured': False,
            'channel': channel,
            'error': "Phone verification is not configured on this server. Please contact administrator."
        }

    try:
        from twilio.rest import Client
        client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
        
        verification = client.verify.v2.services(Config.TWILIO_VERIFY_SERVICE_SID) \
            .verifications \
            .create(to=phone_number, channel=channel)
            
        return {
            'success': True,
            'configured': True,
            'status': verification.status,
            'channel': channel,
            'masked_phone': mask_phone_number(phone_number),
            'purpose': purpose
        }
    except Exception as e:
        logger.error(f"Twilio Verify send error for {mask_phone_number(phone_number)}: {str(e)}")
        return {
            'success': False,
            'configured': True,
            'channel': channel,
            'error': "Unable to deliver verification code. Please check your phone number and try again."
        }

def verify_otp(phone_number: str, code: str, purpose: str = 'SIGNUP_PHONE_VERIFICATION') -> dict:
    """
    Verifies user-submitted 6-digit OTP code against Twilio Verify (Section 13, 16).
    """
    if not code or len(code.strip()) != 6 or not code.strip().isdigit():
        return {
            'success': False,
            'error': "Please enter a valid 6-digit verification code."
        }

    if not is_twilio_configured():
        return {
            'success': False,
            'configured': False,
            'error': "Phone verification is not configured on this server."
        }

    try:
        from twilio.rest import Client
        client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
        
        check = client.verify.v2.services(Config.TWILIO_VERIFY_SERVICE_SID) \
            .verification_checks \
            .create(to=phone_number, code=code.strip())
            
        if check.status == 'approved':
            return {
                'success': True,
                'status': 'approved',
                'purpose': purpose
            }
        else:
            return {
                'success': False,
                'status': check.status,
                'error': "That verification code is invalid or has expired."
            }
    except Exception as e:
        logger.error(f"Twilio Verify check error for {mask_phone_number(phone_number)}: {str(e)}")
        return {
            'success': False,
            'error': "Verification failed or code has expired. Please request a new code."
        }
