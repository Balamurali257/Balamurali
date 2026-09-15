-- ==========================================================
-- CAREBUDDY: SECURE DIGITAL MEDICAL & LIFE DOCUMENT VAULT
-- MySQL 8.0+ Database Schema & Initial Seed Data
-- ==========================================================

CREATE DATABASE IF NOT EXISTS carebuddy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carebuddy_db;

-- 1. USERS TABLE (Sections 28, 29, 48)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    username_normalized VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NULL UNIQUE,
    email_verified BOOLEAN DEFAULT 0,
    email_verified_at TIMESTAMP NULL,
    phone_number VARCHAR(25) NOT NULL UNIQUE,
    phone_verified BOOLEAN DEFAULT 0,
    phone_verified_at TIMESTAMP NULL,
    password_hash VARCHAR(255) NULL,
    role VARCHAR(20) DEFAULT 'USER',
    account_status ENUM('ACTIVE', 'PENDING_PHONE_VERIFICATION', 'LOCKED', 'SUSPENDED', 'DEACTIVATED') DEFAULT 'PENDING_PHONE_VERIFICATION',
    is_active BOOLEAN DEFAULT 1,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_username_norm (username_normalized),
    INDEX idx_users_phone (phone_number),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. AUTH IDENTITIES TABLE (Sections 23, 48)
CREATE TABLE IF NOT EXISTS auth_identities (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    provider ENUM('local', 'google', 'facebook', 'apple') NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(150) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    UNIQUE KEY uk_provider_user (provider, provider_user_id),
    INDEX idx_auth_identities_user (user_id, provider),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backward compatibility table alias for auth_providers
CREATE TABLE IF NOT EXISTS auth_providers (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_provider_legacy (provider, provider_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. USER SESSIONS TABLE (Section 36)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    session_token_hash VARCHAR(64) NOT NULL UNIQUE,
    device_info VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    INDEX idx_user_sessions_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. AUTH AUDIT EVENTS TABLE (Section 37)
CREATE TABLE IF NOT EXISTS auth_events (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NULL,
    event_type VARCHAR(50) NOT NULL,
    provider VARCHAR(30) DEFAULT 'local',
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    success BOOLEAN DEFAULT 1,
    failure_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auth_events_user (user_id),
    INDEX idx_auth_events_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. PASSWORD RESETS TABLE (Section 49)
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_resets_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PATIENT PROFILES
CREATE TABLE IF NOT EXISTS patient_profiles (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    date_of_birth DATE,
    gender VARCHAR(20) DEFAULT 'Prefer not to say',
    blood_group VARCHAR(10) DEFAULT 'O+',
    phone VARCHAR(25),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(25),
    allergies TEXT,
    medical_conditions TEXT,
    current_medications TEXT,
    primary_physician VARCHAR(100),
    physician_phone VARCHAR(25),
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    profile_photo VARCHAR(255) DEFAULT 'default_avatar.png',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(60) NOT NULL UNIQUE,
    description VARCHAR(255),
    icon_class VARCHAR(50) DEFAULT 'bi-folder2-open',
    color_code VARCHAR(20) DEFAULT '#0284c7',
    is_active BOOLEAN DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. MEDICAL REPORTS (Section 32: Document Ownership & Access Control)
CREATE TABLE IF NOT EXISTS medical_reports (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    report_name VARCHAR(150) NOT NULL,
    hospital_name VARCHAR(150),
    doctor_name VARCHAR(150),
    department VARCHAR(100),
    report_date DATE NOT NULL,
    notes TEXT,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    is_favorite BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reports_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. EXPIRING SECURE SHARE LINKS
CREATE TABLE IF NOT EXISTS share_links (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    report_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    share_token VARCHAR(64) NOT NULL UNIQUE,
    pin_hash VARCHAR(255),
    expires_at DATETIME NOT NULL,
    max_views INTEGER DEFAULT 10,
    current_views INTEGER DEFAULT 0,
    is_revoked BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES medical_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. REMINDERS
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    reminder_type VARCHAR(50) DEFAULT 'Checkup',
    reminder_date DATE NOT NULL,
    reminder_time VARCHAR(10),
    description TEXT,
    is_completed BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. AUDIT ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    report_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. DOWNLOAD HISTORY
CREATE TABLE IF NOT EXISTS download_history (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    report_id INTEGER NOT NULL,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (report_id) REFERENCES medical_reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- SEED INITIAL DATA
-- ==========================================================

-- Standard Healthcare Document Categories
INSERT INTO categories (name, description, icon_class, color_code) VALUES
('Blood Test', 'Complete blood count, lipid profiles, metabolic panel', 'bi-droplet-half', '#dc2626'),
('Prescription', 'Doctor prescriptions and medication schedules', 'bi-capsule', '#16a34a'),
('X-Ray', 'Bone scans, chest radiography', 'bi-file-earmark-medical', '#0284c7'),
('MRI / CT Scan', 'Magnetic resonance imaging and tomography', 'bi-disc', '#7c3aed'),
('ECG / Cardiology', 'Electrocardiograms and cardiac health reports', 'bi-activity', '#db2777'),
('Vaccination', 'Immunization history and booster records', 'bi-shield-plus', '#0d9488'),
('Medical Insurance', 'Health policy cards, claims, coverage summaries', 'bi-shield-check', '#0891b2'),
('Discharge Summary', 'Hospital admission summaries and discharge notes', 'bi-hospital', '#ea580c'),
('Dental Report', 'Dentistry diagnostics and treatment records', 'bi-emoji-smile', '#4b5563'),
('Eye Report', 'Vision exams, prescription lenses and retina scans', 'bi-eye', '#2563eb'),
('Other Documents', 'General health records, bills and certificates', 'bi-folder', '#64748b')
ON DUPLICATE KEY UPDATE name=name;

-- Demo Users
-- Password for alex_wright: Demo@123
-- Password for admin: Admin@123
INSERT INTO users (
    id, username, username_normalized, name, email, email_verified, email_verified_at,
    phone_number, phone_verified, phone_verified_at, password_hash, role, account_status
) VALUES
(1, 'alex_wright', 'alex_wright', 'Alexander Wright', 'alexander.wright@gmail.com', 1, NOW(),
 '+15552345678', 1, NOW(), 'pbkdf2:sha256:600000$Wv9L2q8P$341f237894a87dc2c9e78297b83d8cf68019a16f296316719b027d14878a832e', 'USER', 'ACTIVE'),
(2, 'admin', 'admin', 'System Administrator', 'admin@carebuddy.local', 1, NOW(),
 '+15559990001', 1, NOW(), 'pbkdf2:sha256:600000$Wv9L2q8P$341f237894a87dc2c9e78297b83d8cf68019a16f296316719b027d14878a832e', 'ADMIN', 'ACTIVE')
ON DUPLICATE KEY UPDATE username=username;

-- Seed auth_identities records
INSERT INTO auth_identities (user_id, provider, provider_user_id, provider_email) VALUES
(1, 'local', 'alex_wright', 'alexander.wright@gmail.com'),
(2, 'local', 'admin', 'admin@carebuddy.local')
ON DUPLICATE KEY UPDATE provider_user_id=provider_user_id;

-- Seed patient_profiles
INSERT INTO patient_profiles (user_id, date_of_birth, gender, blood_group, phone, address, emergency_contact_name, emergency_contact_phone, allergies, medical_conditions, current_medications, primary_physician, physician_phone, insurance_provider, insurance_policy_number) VALUES
(1, '1990-05-14', 'Male', 'O+', '+1 (555) 234-5678', '742 Evergreen Terrace, Springfield', 'Sarah Wright (Spouse)', '+1 (555) 987-6543', 'Penicillin (Severe), Shellfish (Mild)', 'Mild Asthma, Hypertension (Managed)', 'Lisinopril 10mg (Daily), Albuterol Inhaler (PRN)', 'Dr. Elizabeth Chen, MD', '+1 (555) 345-6789', 'Blue Cross Shield Health Care', 'BCS-8924719-01')
ON DUPLICATE KEY UPDATE date_of_birth=date_of_birth;
