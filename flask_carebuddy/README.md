# CareBuddy – Secure Digital Medical & Life Document Vault
## Python (Flask) + MySQL 8.0+ Full-Stack Implementation

---

### **System Requirements**
* **Operating System:** Windows 10/11, macOS, or Ubuntu 20.04+
* **Python Runtime:** Python 3.10, 3.11, or 3.12
* **Database Engine:** MySQL Server 8.0+ (or MariaDB 10.5+)
* **Browser:** Chrome, Firefox, Safari, or Microsoft Edge

---

### **Quick Setup Guide (Windows / Mac / Linux)**

#### **1. Database Setup (MySQL)**
1. Open MySQL Workbench, XAMPP, or your command prompt:
   ```bash
   mysql -u root -p
   ```
2. Execute the migration schema to create the `carebuddy_db` database and tables:
   ```bash
   mysql -u root -p < flask_carebuddy/database/carebuddy.sql
   ```

#### **2. Python Environment Configuration**
1. Navigate to the `flask_carebuddy` directory:
   ```bash
   cd flask_carebuddy
   ```
2. Create and activate a Python virtual environment:
   * **Windows:**
     ```cmd
     python -m venv venv
     venv\Scripts\activate
     ```
   * **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install required production dependencies:
   ```bash
   pip install -r requirements.txt
   ```

#### **3. Environment Variables**
Copy `.env.example` to `.env` and fill in your MySQL credentials:
```ini
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=carebuddy_db
SECRET_KEY=carebuddy-secret-key-2026
```

#### **4. Run the Application**
```bash
python app.py
```
Open **`http://127.0.0.1:5000`** in your browser.

---

### **Default Test Credentials**
* **Email:** `alexander.wright@gmail.com`
* **Password:** `Demo@123`
* **Role:** `ADMIN`

---

### **Key Modules & Architecture**
* **`app.py`**: Central Flask entry point registering route blueprints.
* **`utils/db.py`**: Parameterized MySQL access layer powered exclusively by PyMySQL.
* **`routes/auth.py`**: Registration, login, logout, and PBKDF2 password hashing.
* **`routes/dashboard.py`**: Metrics, storage aggregation, and audit logs.
* **`routes/profile.py`**: Health profile and Emergency Medical ID Card.
* **`routes/reports.py`**: Document upload, validation, retrieval, streaming, and deletion.
* **`routes/sharing.py`**: Ephemeral QR-code generator, PIN verification, and access limits.
* **`routes/reminders.py`**: Health checkup and medication schedule tracker.
* **`routes/admin.py`**: User account management and category manager.
