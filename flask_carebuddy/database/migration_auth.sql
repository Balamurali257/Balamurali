-- ==========================================================
-- CAREBUDDY AUTHENTICATION UPGRADE MIGRATION (MySQL 8.0+)
-- Upgrades existing CareBuddy database to modern authentication
-- Preserves all existing users, reports, and vault data
-- ==========================================================

-- 1. Safely add modern authentication columns to `users` table if not present
SET @dbname = DATABASE();

-- username
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username') = 0,
    'ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL AFTER id;',
    'SELECT 1;'
));
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- username_normalized
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username_normalized') = 0,
    'ALTER TABLE users ADD COLUMN username_normalized VARCHAR(50) NULL AFTER username;',
    'SELECT 1;'
));
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- phone_number
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') = 0,
    'ALTER TABLE users ADD COLUMN phone_number VARCHAR(25) NULL AFTER username_normalized;',
    'SELECT 1;'
));
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- phone_verified
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_verified') = 0,
    'ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT 0 AFTER phone_number;',
    'SELECT 1;'
));
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- email_verified
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified') = 0,
    'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0 AFTER email;',
    'SELECT 1;'
));
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- account_status
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'account_status') = 0,
    "ALTER TABLE users ADD COLUMN account_status VARCHAR(30) DEFAULT 'ACTIVE' AFTER role;",
    'SELECT 1;'
));
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- last_login_at
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at') = 0,
    'ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL AFTER updated_at;',
    'SELECT 1;'
));
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Backfill existing legacy users with sensible default usernames and statuses
UPDATE users 
SET username = CONCAT('user_', id) 
WHERE username IS NULL OR username = '';

UPDATE users 
SET username_normalized = LOWER(username) 
WHERE username_normalized IS NULL OR username_normalized = '';

UPDATE users 
SET account_status = 'ACTIVE' 
WHERE account_status IS NULL OR account_status = '';

-- Make email nullable for phone-only/social users if desired
ALTER TABLE users MODIFY COLUMN email VARCHAR(150) NULL;
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- 3. Create index and unique constraints
ALTER TABLE users ADD UNIQUE INDEX idx_username_norm (username_normalized);
ALTER TABLE users ADD INDEX idx_phone (phone_number);

-- 4. Create `auth_providers` table (Section 12)
CREATE TABLE IF NOT EXISTS auth_providers (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    provider ENUM('LOCAL', 'GOOGLE', 'FACEBOOK', 'APPLE') NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_provider_user (provider, provider_user_id),
    INDEX idx_user_provider (user_id, provider),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Seed LOCAL provider records for existing users with passwords
INSERT IGNORE INTO auth_providers (user_id, provider, provider_user_id, provider_email)
SELECT id, 'LOCAL', username, email FROM users WHERE password_hash IS NOT NULL AND password_hash != '';
