from flask import Blueprint, render_template, request, redirect, url_for, session, flash, abort
from utils.db import query_db, execute_db
from utils.auth_helpers import admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin')
@admin_required
def index():
    users_count = query_db("SELECT COUNT(*) as c FROM users", one=True)['c']
    reports_count = query_db("SELECT COUNT(*) as c FROM medical_reports", one=True)['c']
    storage_bytes = query_db("SELECT COALESCE(SUM(file_size_bytes), 0) as s FROM medical_reports", one=True)['s']
    storage_mb = round(storage_bytes / (1024 * 1024), 2)
    
    categories = query_db("""
        SELECT c.*, COUNT(r.id) as report_count
        FROM categories c
        LEFT JOIN medical_reports r ON c.id = r.category_id
        GROUP BY c.id
    """)
    
    recent_activity = query_db("""
        SELECT a.*, u.name as user_name, u.email as user_email
        FROM activity_logs a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC LIMIT 10
    """)
    
    return render_template('admin/dashboard.html',
                           users_count=users_count,
                           reports_count=reports_count,
                           storage_mb=storage_mb,
                           categories=categories,
                           recent_activity=recent_activity)

@admin_bp.route('/admin/users')
@admin_required
def users():
    search = request.args.get('search', '').strip()
    if search:
        users_list = query_db("SELECT u.*, p.blood_group, p.phone FROM users u LEFT JOIN patient_profiles p ON u.id = p.user_id WHERE u.name LIKE %s OR u.email LIKE %s", (f"%{search}%", f"%{search}%"))
    else:
        users_list = query_db("SELECT u.*, p.blood_group, p.phone FROM users u LEFT JOIN patient_profiles p ON u.id = p.user_id ORDER BY u.created_at DESC")
    return render_template('admin/users.html', users=users_list, search=search)

@admin_bp.route('/admin/users/<int:user_id>/toggle-status', methods=['POST'])
@admin_required
def toggle_user_status(user_id):
    user = query_db("SELECT * FROM users WHERE id = %s", (user_id,), one=True)
    if user:
        new_active = not user['is_active']
        new_status = 'ACTIVE' if new_active else 'DISABLED'
        execute_db("UPDATE users SET is_active = %s, account_status = %s WHERE id = %s", 
                   (new_active, new_status, user_id))
        flash(f"User account {'activated' if new_active else 'disabled'} successfully.", 'info')
    return redirect(url_for('admin.users'))

@admin_bp.route('/admin/categories', methods=['GET', 'POST'])
@admin_required
def categories():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        desc = request.form.get('description', '').strip()
        icon = request.form.get('icon_class', 'bi-folder2-open').strip()
        color = request.form.get('color_code', '#0284c7').strip()
        
        if name:
            execute_db("INSERT INTO categories (name, description, icon_class, color_code) VALUES (%s, %s, %s, %s)",
                       (name, desc, icon, color))
            flash('Category added successfully!', 'success')
            return redirect(url_for('admin.categories'))
            
    cats = query_db("""
        SELECT c.*, COUNT(r.id) as report_count
        FROM categories c
        LEFT JOIN medical_reports r ON c.id = r.category_id
        GROUP BY c.id
    """)
    return render_template('admin/categories.html', categories=cats)

@admin_bp.route('/admin/audit-logs')
@admin_required
def audit_logs():
    events = query_db("""
        SELECT a.*, u.username, u.name as user_name, u.email as user_email
        FROM auth_events a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC LIMIT 50
    """)
    return render_template('admin/audit_logs.html', events=events)

