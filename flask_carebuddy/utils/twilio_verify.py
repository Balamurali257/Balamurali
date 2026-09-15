import re
import logging
from config import Config

logger = logging.getLogger('carebuddy.auth')

def mask_phone_number(phone: str) -> str:
    """
    Masks phone numbers to protect user privacy (Section 11).
    Example: +919876543210 -> +91••••••3210
             +14155552671 -> +1••••••2671
    """
    if not phone:
        return ""
    clean = phone.strip()
    if len(clean) <= 6:
        return clean
    # Show first 2-3 characters (country code) and last 4 characters
    prefix = clean[:3] if clean.startswith('+') else clean[:2]
    suffix = clean[-4:]
    masked_middle = '•' * max(4, len(clean) - len(prefix) - len(suffix))
    return f"{prefix}{masked_middle}{suffix}"

def is_twilio_configured() -> bool:
    """Checks if real Twilio credentials are provided in configuration."""
    return bool(
        Config.TWILIO_ACCOUNT_SID and 
        Config.TWILIO_AUTH_TOKEN and 
        Config.TWILIO_VERIFY_SERVICE_SID and 
        not Config.TWILIO_ACCOUNT_SID.startswith('ACxxx')
    )

def send_twilio_otp(phone_number: str, channel: str = 'sms') -> dict:
    """
    Sends OTP via Twilio Verify API (Section 8-9).
    Allowed channels: 'sms', 'whatsapp'.
    Supports safe development mode bypass when credentials are absent or DEV_OTP_BYPASS=true.
    Never exposes raw OTP or Twilio credentials to frontend.
    """
    channel = channel.lower()
    if channel not in ('sms', 'whatsapp'):
        channel = 'sms'

    # If real Twilio credentials are configured and valid
    if is_twilio_configured():
        try:
            from twilio.rest import Client
            client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
            
            # Format phone for Twilio Verify
            # Note: WhatsApp channel in Twilio Verify expects standard E.164 phone
            verification = client.verify.v2.services(Config.TWILIO_VERIFY_SERVICE_SID) \
                .verifications \
                .create(to=phone_number, channel=channel)
                
            return {
                'success': True,
                'status': verification.status,
                'channel': channel,
                'masked_phone': mask_phone_number(phone_number),
                'is_dev_mode': False,
                'message': f"OTP sent via {channel.upper()}"
            }
        except Exception as e:
            logger.error(f"Twilio Verify Send Error: {str(e)}")
            # Fallback to dev mode if enabled
            if Config.DEV_OTP_BYPASS:
                logger.warning("Twilio API failed; falling back to development bypass OTP.")
                return {
                    'success': True,
                    'status': 'pending',
                    'channel': channel,
                    'masked_phone': mask_phone_number(phone_number),
                    'is_dev_mode': True,
                    'dev_hint': '123456',
                    'message': f"[Dev Mode] Simulated OTP (Code: 123456) for {mask_phone_number(phone_number)}"
                }
            return {
                'success': False,
                'error': "Failed to send verification code via telecom provider. Please try again.",
                'is_dev_mode': False
            }

    # Safe Local Development / Viva Mode (Section 36)
    if Config.DEV_OTP_BYPASS or Config.ENV == 'development':
        logger.info(f"[DEV_OTP_BYPASS] Simulated OTP dispatched to {mask_phone_number(phone_number)} via {channel.upper()}")
        return {
            'success': True,
            'status': 'pending',
            'channel': channel,
            'masked_phone': mask_phone_number(phone_number),
            'is_dev_mode': True,
            'dev_hint': '123456',
            'message': f"[Dev Mode] Simulated OTP (Code: 123456) dispatched via {channel.upper()}"
        }

    return {
        'success': False,
        'error': "SMS/WhatsApp verification service is currently unconfigured. Please contact support.",
        'is_dev_mode': False
    }

def check_twilio_otp(phone_number: str, code: str) -> dict:
    """
    Verifies user-provided OTP using Twilio Verify API (Section 10).
    Never logs raw OTP code.
    """
    code = (code or '').strip()
    if not code or len(code) != 6 or not code.isdigit():
        return {
            'success': False,
            'error': "Verification code must be a 6-digit number."
        }

    # If real Twilio credentials are configured
    if is_twilio_configured():
        try:
            from twilio.rest import Client
            client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
            verification_check = client.verify.v2.services(Config.TWILIO_VERIFY_SERVICE_SID) \
                .verification_checks \
                .create(to=phone_number, code=code)
                
            if verification_check.status == 'approved':
                return {
                    'success': True,
                    'approved': True,
                    'status': verification_check.status
                }
            else:
                return {
                    'success': False,
                    'approved': False,
                    'error': "Invalid or expired verification code. Please try again."
                }
        except Exception as e:
            logger.error(f"Twilio Verify Check Error: {str(e)}")
            # If in dev mode and test code matches
            if Config.DEV_OTP_BYPASS and code == '123456':
                return {'success': True, 'approved': True, 'status': 'approved'}
            return {
                'success': False,
                'approved': False,
                'error': "Verification service error. Please request a new code."
            }

    # Safe Local Development / Viva Mode (Section 36)
    if Config.DEV_OTP_BYPASS or Config.ENV == 'development':
        # Accept '123456' as standard bypass code in dev
        if code == '123456':
            return {
                'success': True,
                'approved': True,
                'status': 'approved'
            }
        else:
            return {
                'success': False,
                'approved': False,
                'error': "Invalid verification code. [Dev Mode Hint: Enter 123456]"
            }

    return {
        'success': False,
        'approved': False,
        'error': "Verification provider is not reachable."
    }
