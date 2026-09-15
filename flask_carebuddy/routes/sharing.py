from datetime import datetime, timedelta
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, abort, send_from_directory
import secrets
from utils.db import query_db, execute_db
from utils.auth_helpers import login_required, hash_password, verify_password
from utils.qr import generate_qr_code_image
from config import Config

sharing_bp = Blueprint('sharing', __name__)

@sharing_bp.route('/reports/<int:report_id>/share', methods=['GET', 'POST'])
@login_required
def create_share(report_id):
    user_id = session['user_id']
    report = query_db("SELECT * FROM medical_reports WHERE id = %s AND user_id = %s", (report_id, user_id), one=True)
    if not report:
        abort(404)
        
    if request.method == 'POST':
        duration_hours = int(request.form.get('duration', 24))
        pin = request.form.get('pin', '').strip()
        max_views = int(request.form.get('max_views', 10))
        
        expires_at = datetime.now() + timedelta(hours=duration_hours)
        token = secrets.token_urlsafe(16)
        pin_h = hash_password(pin) if pin else None
        
        execute_db("""
            INSERT INTO share_links (report_id, user_id, share_token, pin_hash, expires_at, max_views)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (report_id, user_id, token, pin_h, expires_at, max_views))
        
        share_url = request.host_url.rstrip('/') + url_for('sharing.view_shared', token=token)
        qr_file = generate_qr_code_image(share_url, token)
        
        execute_db("INSERT INTO activity_logs (user_id, action_type, description, report_id) VALUES (%s, %s, %s, %s)",
                   (user_id, 'SHARE_CREATED', f"Generated secure QR share link for {report['report_name']}", report_id))
        
        return render_template('share.html', report=report, share_url=share_url, qr_file=qr_file, expires_at=expires_at, pin=pin, token=token)
        
    return render_template('share.html', report=report)

@sharing_bp.route('/share/<token>', methods=['GET', 'POST'])
def view_shared(token):
    share = query_db("""
        SELECT s.*, r.report_name, r.hospital_name, r.doctor_name, r.report_date, r.file_name, r.file_type, r.original_file_name, r.notes, u.name as owner_name
        FROM share_links s
        JOIN medical_reports r ON s.report_id = r.id
        JOIN users u ON s.user_id = u.id
        WHERE s.share_token = %s
    """, (token,), one=True)
    
    if not share:
        return render_template('shared_document.html', status='invalid'), 404
        
    if share['is_revoked']:
        return render_template('shared_document.html', status='revoked'), 403
        
    if datetime.now() > share['expires_at']:
        return render_template('shared_document.html', status='expired'), 403
        
    if share['current_views'] >= share['max_views']:
        return render_template('shared_document.html', status='limit_reached'), 403
        
    # Check PIN Gate
    if share['pin_hash']:
        if request.method == 'POST':
            entered_pin = request.form.get('pin', '').strip()
            if not verify_password(share['pin_hash'], entered_pin):
                flash('Incorrect 4-digit security PIN. Access denied.', 'danger')
                return render_template('shared_document.html', status='pin_required', token=token)
        else:
            return render_template('shared_document.html', status='pin_required', token=token)
            
    # Increment view count in MySQL
    execute_db("UPDATE share_links SET current_views = current_views + 1 WHERE id = %s", (share['id'],))
    
    return render_template('shared_document.html', status='authorized', share=share)

@sharing_bp.route('/share/<token>/revoke', methods=['POST'])
@login_required
def revoke_share(token):
    user_id = session['user_id']
    share = query_db("SELECT * FROM share_links WHERE share_token = %s AND user_id = %s", (token, user_id), one=True)
    if not share:
        abort(404)
        
    execute_db("UPDATE share_links SET is_revoked = TRUE WHERE id = %s", (share['id'],))
    execute_db("INSERT INTO activity_logs (user_id, action_type, description, report_id) VALUES (%s, %s, %s, %s)",
               (user_id, 'REVOKE_SHARE', f"Revoked share access token {token[:8]}...", share['report_id']))
    
    flash('Share link revoked successfully. Recipient access disabled.', 'info')
    return redirect(url_for('reports.view', report_id=share['report_id']))
