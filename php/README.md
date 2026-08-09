# Saman Adhikar Party (समान अधिकार पार्टी) - Full PHP Conversion & Hosting Guide

This directory contains the entire Saman Adhikar Party application converted into pure, production-ready **PHP & MySQL**.

---

## 📁 Directory Structure & Converted Files

1. `index.php` - Homepage with Hero section, party agendas, stats, leader bio, and recent news.
2. `config.php` - Party configuration, bank details, Gemini API settings, and utility functions.
3. `db.php` - Database connection wrapper with PDO MySQL and automatic SQLite fallback.
4. `api.php` - RESTful JSON API supporting mobile apps or frontend AJAX requests.
5. `press.php` - Dedicated Press Releases and Media Briefing portal.
6. `admin.php` - Admin Panel (Username: `admin`, Password: `admin123`) to publish press releases and view members.
7. `donate.php` - Donation portal with SBI Bank details, UPI QR Code, 12-digit UTR validation, and receipt generation.
8. `membership.php` - Party Member Registration and Digital ID Card Generator.
9. `events.php` - Event schedule and VIP entry pass ticket generator.
10. `ai_assistant.php` - Gemini AI Campaign Assistant implemented using PHP cURL.
11. `database.sql` - MySQL Database schema and seed data.

---

## 🚀 How to Host on cPanel / Hostinger / GoDaddy / Apache / Nginx

### Step 1: Upload Files
Upload all files inside the `/php/` directory to your web hosting root (`public_html` or www folder).

### Step 2: Import Database
1. Open **phpMyAdmin** in your hosting control panel.
2. Create a new database named `saman_adhikar_party`.
3. Click **Import** and select `database.sql`.

### Step 3: Configure Database Credentials
Edit `config.php` and set your database connection details:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'your_db_username');
define('DB_PASS', 'your_db_password');
define('DB_NAME', 'saman_adhikar_party');
```

### Step 4: Add Gemini API Key (Optional for AI Chat)
In `config.php`, insert your Gemini API Key:
```php
define('GEMINI_API_KEY', 'your_gemini_api_key_here');
```

---

## 🔐 Default Admin Credentials
- **URL**: `https://yourdomain.com/admin.php`
- **Username**: `admin`
- **Password**: `admin123`
