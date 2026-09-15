import os
import secrets
from flask import Flask, render_template, session, request
from config import Config

# Initialize Flask App
app = Flask(__name__)
app.config.from_object(Config)

# Ensure upload folders exist
for folder in [Config.UPLOAD_FOLDER, Config.PROFILE_UPLOAD_FOLDER, Config.QR_UPLOAD_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# CSRF Token Session Generator / Middleware
@app.before_request
def csrf_protect():
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(16)

@app.context_processor
def inject_csrf_token():
    return dict(csrf_token=session.get('csrf_token', ''))

# Register Route Blueprints
from routes.auth import auth_bp
from routes.oauth import oauth_bp
from routes.settings import settings_bp
from routes.dashboard import dashboard_bp
from routes.profile import profile_bp
from routes.reports import reports_bp
from routes.reminders import reminders_bp
from routes.sharing import sharing_bp
from routes.admin import admin_bp

app.register_blueprint(auth_bp)
app.register_blueprint(oauth_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(reminders_bp)
app.register_blueprint(sharing_bp)
app.register_blueprint(admin_bp)

# Friendly Error Handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(403)
def forbidden_access(e):
    return render_template('403.html'), 403

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500

if __name__ == '__main__':
    # Local development server execution
    app.run(host='0.0.0.0', port=5000, debug=True)
