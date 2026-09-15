import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

class Config:
    # Flask Environment & Security
    ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() in ('true', '1', 'yes')
    SECRET_KEY = os.getenv('SECRET_KEY', 'carebuddy-healthcare-production-secret-2026')
    
    # Session Cookie Security (Section 33)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'false').lower() in ('true', '1', 'yes') if ENV == 'development' else True
    SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # Strictly MySQL 8.0+ Configuration via PyMySQL (Section 71)
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'password')
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'carebuddy_db')
    
    # Provider Enable Flags (Section 73)
    TWILIO_ENABLED = os.getenv('TWILIO_ENABLED', 'true').lower() in ('true', '1', 'yes')
    TWILIO_WHATSAPP_ENABLED = os.getenv('TWILIO_WHATSAPP_ENABLED', 'false').lower() in ('true', '1', 'yes')
    
    GOOGLE_AUTH_ENABLED = os.getenv('GOOGLE_AUTH_ENABLED', 'true').lower() in ('true', '1', 'yes')
    FACEBOOK_AUTH_ENABLED = os.getenv('FACEBOOK_AUTH_ENABLED', 'true').lower() in ('true', '1', 'yes')
    APPLE_AUTH_ENABLED = os.getenv('APPLE_AUTH_ENABLED', 'true').lower() in ('true', '1', 'yes')
    
    # Twilio Verify for SMS and WhatsApp OTP (Section 13-15)
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
    TWILIO_VERIFY_SERVICE_SID = os.getenv('TWILIO_VERIFY_SERVICE_SID', '')
    
    # Google OAuth / OpenID Connect (Section 18-19)
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')
    
    # Facebook / Meta Login (Section 20)
    FACEBOOK_APP_ID = os.getenv('FACEBOOK_APP_ID', '')
    FACEBOOK_APP_SECRET = os.getenv('FACEBOOK_APP_SECRET', '')
    FACEBOOK_REDIRECT_URI = os.getenv('FACEBOOK_REDIRECT_URI', 'http://localhost:5000/auth/facebook/callback')
    
    # Sign in with Apple (Section 21-22)
    APPLE_CLIENT_ID = os.getenv('APPLE_CLIENT_ID', '')
    APPLE_TEAM_ID = os.getenv('APPLE_TEAM_ID', '')
    APPLE_KEY_ID = os.getenv('APPLE_KEY_ID', '')
    APPLE_PRIVATE_KEY_PATH = os.getenv('APPLE_PRIVATE_KEY_PATH', '')
    APPLE_REDIRECT_URI = os.getenv('APPLE_REDIRECT_URI', 'http://localhost:5000/auth/apple/callback')
    
    # Rate Limiting & Account Protection (Section 38, 39)
    AUTH_RATE_LIMIT_ENABLED = os.getenv('AUTH_RATE_LIMIT_ENABLED', 'true').lower() in ('true', '1', 'yes')
    MAX_FAILED_LOGIN_ATTEMPTS = int(os.getenv('MAX_FAILED_LOGIN_ATTEMPTS', 5))
    ACCOUNT_LOCKOUT_MINUTES = int(os.getenv('ACCOUNT_LOCKOUT_MINUTES', 15))
    
    # Upload Directories & Storage Constraints
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads', 'reports')
    PROFILE_UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads', 'profiles')
    QR_UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads', 'qr')
    
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB limit
    ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}
