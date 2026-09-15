from flask import Blueprint, render_template, request, redirect, url_for, session, flash, abort
from utils.db import query_db, execute_db
from utils.auth_helpers import login_required

reminders_bp = Blueprint('reminders', __name__)

@reminders_bp.route('/reminders')
@login_required
def index():
    user_id = session['user_id']
    reminders = query_db("""
        SELECT * FROM reminders
        WHERE user_id = %s
        ORDER BY is_completed ASC, reminder_date ASC
    """, (user_id,))
    return render_template('reminders.html', reminders=reminders)

@reminders_bp.route('/reminders/create', methods=['POST'])
@login_required
def create():
    user_id = session['user_id']
    title = request.form.get('title', '').strip()
    reminder_type = request.form.get('reminder_type', 'Checkup')
    reminder_date = request.form.get('reminder_date')
    reminder_time = request.form.get('reminder_time', '')
    description = request.form.get('description', '').strip()
    
    if not title or not reminder_date:
        flash('Title and date are required.', 'danger')
        return redirect(url_for('reminders.index'))
        
    execute_db("""
        INSERT INTO reminders (user_id, title, reminder_type, reminder_date, reminder_time, description)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (user_id, title, reminder_type, reminder_date, reminder_time, description))
    
    execute_db("INSERT INTO activity_logs (user_id, action_type, description) VALUES (%s, %s, %s)",
               (user_id, 'REMINDER_CREATE', f"Scheduled reminder: {title} on {reminder_date}"))
    
    flash('Reminder scheduled successfully!', 'success')
    return redirect(url_for('reminders.index'))

@reminders_bp.route('/reminders/<int:reminder_id>/complete', methods=['POST'])
@login_required
def complete(reminder_id):
    user_id = session['user_id']
    execute_db("UPDATE reminders SET is_completed = TRUE WHERE id = %s AND user_id = %s", (reminder_id, user_id))
    execute_db("INSERT INTO activity_logs (user_id, action_type, description) VALUES (%s, %s, %s)",
               (user_id, 'REMINDER_COMPLETE', f"Marked reminder #{reminder_id} as completed"))
    flash('Reminder marked as completed!', 'success')
    return redirect(url_for('reminders.index'))

@reminders_bp.route('/reminders/<int:reminder_id>/delete', methods=['POST'])
@login_required
def delete(reminder_id):
    user_id = session['user_id']
    execute_db("DELETE FROM reminders WHERE id = %s AND user_id = %s", (reminder_id, user_id))
    flash('Reminder removed.', 'info')
    return redirect(url_for('reminders.index'))
