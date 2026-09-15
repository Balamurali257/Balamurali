from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from utils.db import query_db, execute_db
from utils.auth_helpers import login_required

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def index():
    user_id = session['user_id']
    
    if request.method == 'POST':
        date_of_birth = request.form.get('date_of_birth')
        gender = request.form.get('gender')
        blood_group = request.form.get('blood_group')
        phone = request.form.get('phone')
        address = request.form.get('address')
        emergency_name = request.form.get('emergency_contact_name')
        emergency_phone = request.form.get('emergency_contact_phone')
        allergies = request.form.get('allergies')
        medical_conditions = request.form.get('medical_conditions')
        current_medications = request.form.get('current_medications')
        primary_physician = request.form.get('primary_physician')
        physician_phone = request.form.get('physician_phone')
        insurance_provider = request.form.get('insurance_provider')
        insurance_policy_number = request.form.get('insurance_policy_number')
        
        execute_db("""
            UPDATE patient_profiles SET
                date_of_birth = %s, gender = %s, blood_group = %s, phone = %s,
                address = %s, emergency_contact_name = %s, emergency_contact_phone = %s,
                allergies = %s, medical_conditions = %s, current_medications = %s,
                primary_physician = %s, physician_phone = %s,
                insurance_provider = %s, insurance_policy_number = %s
            WHERE user_id = %s
        """, (date_of_birth, gender, blood_group, phone, address, emergency_name,
              emergency_phone, allergies, medical_conditions, current_medications,
              primary_physician, physician_phone, insurance_provider, insurance_policy_number, user_id))
        
        execute_db("INSERT INTO activity_logs (user_id, action_type, description) VALUES (%s, %s, %s)",
                   (user_id, 'PROFILE_UPDATE', 'Updated patient health profile'))
        
        flash('Health Profile updated successfully!', 'success')
        return redirect(url_for('profile.index'))
        
    profile = query_db("""
        SELECT u.name, u.email, p.*
        FROM users u
        LEFT JOIN patient_profiles p ON u.id = p.user_id
        WHERE u.id = %s
    """, (user_id,), one=True)
    
    return render_template('profile.html', profile=profile)

@profile_bp.route('/emergency')
@login_required
def emergency_card():
    user_id = session['user_id']
    profile = query_db("""
        SELECT u.name, u.email, p.*
        FROM users u
        LEFT JOIN patient_profiles p ON u.id = p.user_id
        WHERE u.id = %s
    """, (user_id,), one=True)
    return render_template('emergency.html', profile=profile)
