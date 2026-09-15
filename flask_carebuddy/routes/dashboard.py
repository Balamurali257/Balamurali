from flask import Blueprint, render_template, session
from utils.db import query_db
from utils.auth_helpers import login_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
@login_required
def index():
    user_id = session['user_id']
    
    # 1. Total reports count
    rep_res = query_db("SELECT COUNT(*) as count FROM medical_reports WHERE user_id = %s", (user_id,), one=True)
    reports_count = rep_res['count'] if rep_res else 0
    
    # 2. Total Storage (MB)
    st_res = query_db("SELECT COALESCE(SUM(file_size_bytes), 0) as total FROM medical_reports WHERE user_id = %s", (user_id,), one=True)
    storage_mb = round((st_res['total'] if st_res else 0) / (1024 * 1024), 2)
    
    # 3. Upcoming reminders count
    rem_res = query_db("SELECT COUNT(*) as count FROM reminders WHERE user_id = %s AND is_completed = 0", (user_id,), one=True)
    reminders_count = rem_res['count'] if rem_res else 0
    
    # 4. Recent Reports (Latest 5)
    recent_reports = query_db("""
        SELECT r.*, c.name as category_name, c.color_code, c.icon_class
        FROM medical_reports r
        JOIN categories c ON r.category_id = c.id
        WHERE r.user_id = %s
        ORDER BY r.report_date DESC LIMIT 5
    """, (user_id,))
    
    # 5. Upcoming Reminders
    upcoming_reminders = query_db("""
        SELECT * FROM reminders
        WHERE user_id = %s AND is_completed = 0
        ORDER BY reminder_date ASC LIMIT 4
    """, (user_id,))
    
    # 6. Recent Activity
    activities = query_db("""
        SELECT * FROM activity_logs
        WHERE user_id = %s
        ORDER BY created_at DESC LIMIT 5
    """, (user_id,))
    
    return render_template('dashboard.html',
                           reports_count=reports_count,
                           storage_mb=storage_mb,
                           reminders_count=reminders_count,
                           recent_reports=recent_reports,
                           upcoming_reminders=upcoming_reminders,
                           activities=activities)
