import os
import secrets
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, send_from_directory, current_app
from werkzeug.utils import secure_filename
from utils.db import query_db, execute_db
from utils.auth_helpers import login_required
from config import Config

reports_bp = Blueprint('reports', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

@reports_bp.route('/reports')
@login_required
def index():
    user_id = session['user_id']
    category_filter = request.args.get('category')
    search_query = request.args.get('q', '').strip()
    
    query = """
        SELECT r.*, c.name as category_name, c.color_code, c.icon_class
        FROM medical_reports r
        JOIN categories c ON r.category_id = c.id
        WHERE r.user_id = %s
    """
    params = [user_id]
    
    if category_filter:
        query += " AND r.category_id = %s"
        params.append(category_filter)
        
    if search_query:
        query += " AND (r.report_name LIKE %s OR r.hospital_name LIKE %s OR r.doctor_name LIKE %s)"
        like_term = f"%{search_query}%"
        params.extend([like_term, like_term, like_term])
        
    query += " ORDER BY r.report_date DESC"
    reports = query_db(query, tuple(params))
    categories = query_db("SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC")
    
    return render_template('reports.html', reports=reports, categories=categories, 
                           selected_category=category_filter, search_query=search_query)

@reports_bp.route('/reports/upload', methods=['GET', 'POST'])
@login_required
def upload():
    user_id = session['user_id']
    categories = query_db("SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC")
    
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No document file selected.', 'danger')
            return redirect(request.url)
            
        file = request.files['file']
        if file.filename == '':
            flash('No file selected.', 'danger')
            return redirect(request.url)
            
        if file and allowed_file(file.filename):
            category_id = request.form.get('category_id')
            report_name = request.form.get('report_name', '').strip()
            hospital_name = request.form.get('hospital_name', '').strip()
            doctor_name = request.form.get('doctor_name', '').strip()
            department = request.form.get('department', '').strip()
            report_date = request.form.get('report_date')
            notes = request.form.get('notes', '').strip()
            
            orig_name = secure_filename(file.filename)
            ext = orig_name.rsplit('.', 1)[1].lower()
            storage_name = f"rep_{user_id}_{secrets.token_hex(8)}.{ext}"
            filepath = os.path.join(Config.UPLOAD_FOLDER, storage_name)
            
            os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
            file.save(filepath)
            size_bytes = os.path.getsize(filepath)
            
            execute_db("""
                INSERT INTO medical_reports (
                    user_id, category_id, report_name, hospital_name, doctor_name,
                    department, report_date, notes, file_name, original_file_name,
                    file_type, file_size_bytes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (user_id, category_id, report_name, hospital_name, doctor_name,
                  department, report_date, notes, storage_name, orig_name, ext, size_bytes))
                  
            execute_db("INSERT INTO activity_logs (user_id, action_type, description) VALUES (%s, %s, %s)",
                       (user_id, 'UPLOAD_REPORT', f"Uploaded health report: {report_name}"))
                       
            flash('Medical report uploaded and secured successfully!', 'success')
            return redirect(url_for('reports.index'))
        else:
            flash('Invalid file format. Allowed formats: PDF, JPG, PNG.', 'danger')
            
    return render_template('upload_report.html', categories=categories)

@reports_bp.route('/reports/view/<int:report_id>')
@login_required
def view_report(report_id):
    user_id = session['user_id']
    report = query_db("""
        SELECT r.*, c.name as category_name, c.color_code, c.icon_class
        FROM medical_reports r
        JOIN categories c ON r.category_id = c.id
        WHERE r.id = %s AND r.user_id = %s
    """, (report_id, user_id), one=True)
    
    if not report:
        flash('Report not found or permission denied.', 'danger')
        return redirect(url_for('reports.index'))
        
    return render_template('view_report.html', report=report)

@reports_bp.route('/reports/<int:report_id>/download')
@login_required
def download_report(report_id):
    user_id = session['user_id']
    report = query_db("SELECT * FROM medical_reports WHERE id = %s AND user_id = %s", (report_id, user_id), one=True)
    if not report:
        flash('Report not found or permission denied.', 'danger')
        return redirect(url_for('reports.index'))
    try:
        execute_db("INSERT INTO download_history (user_id, report_id) VALUES (%s, %s)", (user_id, report['id']))
    except Exception:
        pass
    return send_from_directory(Config.UPLOAD_FOLDER, report['file_name'], as_attachment=True, download_name=report.get('original_file_name'))

@reports_bp.route('/reports/download/<filename>')
@login_required
def download_file(filename):
    user_id = session['user_id']
    report = query_db("SELECT * FROM medical_reports WHERE file_name = %s AND user_id = %s", (filename, user_id), one=True)
    if not report:
        flash('Report not found or permission denied.', 'danger')
        return redirect(url_for('reports.index'))
    try:
        execute_db("INSERT INTO download_history (user_id, report_id) VALUES (%s, %s)", (user_id, report['id']))
    except Exception:
        pass
    return send_from_directory(Config.UPLOAD_FOLDER, filename, as_attachment=True, download_name=report.get('original_file_name'))

