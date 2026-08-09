<?php
/**
 * Database connection handler for Saman Adhikar Party PHP App
 * Supports PDO MySQL and fallback SQLite for easy local testing.
 */

require_once __DIR__ . '/config.php';

function get_db_connection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        // Try MySQL first
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]);
        return $pdo;
    } catch (PDOException $e) {
        // Fallback to SQLite file database if MySQL is not setup yet
        $sqlitePath = __DIR__ . '/saman_adhikar_party.sqlite';
        $pdo = new PDO("sqlite:" . $sqlitePath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        init_sqlite_tables($pdo);
        return $pdo;
    }
}

function init_sqlite_tables($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS press_releases (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            title_en TEXT,
            content TEXT NOT NULL,
            content_en TEXT,
            category TEXT,
            date TEXT,
            location TEXT,
            spokesperson TEXT,
            image_url TEXT,
            is_urgent INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS donations (
            id TEXT PRIMARY KEY,
            donor_name TEXT,
            amount REAL,
            frequency TEXT,
            precinct TEXT,
            timestamp TEXT,
            is_anonymous INTEGER,
            message TEXT,
            payment_method TEXT,
            utr_number TEXT
        );

        CREATE TABLE IF NOT EXISTS members (
            id TEXT PRIMARY KEY,
            full_name TEXT,
            email TEXT,
            phone TEXT,
            precinct TEXT,
            membership_tier TEXT,
            interests TEXT,
            joined_date TEXT,
            member_card_id TEXT,
            membership_fee REAL,
            payment_method TEXT,
            utr_number TEXT,
            is_fee_paid INTEGER
        );

        CREATE TABLE IF NOT EXISTS rsvps (
            id TEXT PRIMARY KEY,
            event_id TEXT,
            event_title TEXT,
            attendee_name TEXT,
            attendee_email TEXT,
            guests_count INTEGER,
            qr_code_token TEXT,
            timestamp TEXT
        );
    ");
}
