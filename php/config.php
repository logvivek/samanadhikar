<?php
/**
 * Saman Adhikar Party (समान अधिकार पार्टी)
 * Official PHP Application Configuration & Constants
 */

// Database Settings (MySQL/MariaDB)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'saman_adhikar_party');
define('DB_PORT', getenv('DB_PORT') ?: 3306);

// Gemini AI API Settings
define('GEMINI_API_KEY', getenv('GEMINI_API_KEY') ?: '');
define('GEMINI_MODEL', 'gemini-3.6-flash');

// Admin Auth Credentials
define('ADMIN_USERNAME', getenv('ADMIN_USERNAME') ?: 'admin');
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'admin123');
define('ADMIN_SECRET_TOKEN', 'sap-admin-token-2026-secure');

// Party Metadata & Bank Details
$PARTY_INFO = [
    'name' => 'समान अधिकार पार्टी',
    'nameEnglish' => 'Saman Adhikar Party',
    'leaderName' => 'कुलदीप शर्मा (Kuldeep Sharma)',
    'leaderRole' => 'राष्ट्रीय अध्यक्ष (National President)',
    'motto' => 'समान अधिकार लाना है, श्रेष्ठ भारत बनाना है!',
    'mottoEnglish' => 'Bring Equal Rights, Build a Supreme India!',
    'primarySlogan' => 'तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा',
    'secondarySlogan' => 'हर हर महादेव | जय हनुमान | जय हिन्दू राष्ट्र | जय गौमाता',
    'contactPhone1' => '9412165541',
    'contactPhone2' => '7310732088',
    'headquarters' => 'सदर बाजार, आगरा एवं मथुरा, उत्तर प्रदेश, भारत',
    'bankDetails' => [
        'bankName' => 'भारतीय स्टेट बैंक (State Bank of India)',
        'branch' => 'सदर बाजार, आगरा (Sadar Bazar, Agra)',
        'accountNo' => '34465318239',
        'ifscCode' => 'SBIN0002467',
        'upiId' => 'samanadhikarparty@sbi',
        'accountHolder' => 'SAMAN ADHIKAR PARTY'
    ]
];

// Helper to return JSON Response
function json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// UTR / Transaction ID Sanitizer & Validator
function validate_utr($utrNumber) {
    $cleanUtr = strtoupper(trim(preg_replace('/\s+/', '', $utrNumber)));
    if (empty($cleanUtr)) {
        return ['valid' => true, 'utr' => 'UTR' . time() . rand(100, 999)];
    }
    $is12DigitUpi = preg_match('/^\d{12}$/', $cleanUtr);
    $isAlphaNumTxn = preg_match('/^[A-Z0-9]{10,24}$/', $cleanUtr) && preg_match('/\d/', $cleanUtr);
    if (!$is12DigitUpi && !$isAlphaNumTxn) {
        return [
            'valid' => false,
            'error' => 'अमान्य UTR / ट्रांजैक्शन ID दर्ज किया गया है। कृपया PhonePe/Paytm/GPay रसीद से 12-अंकीय UTR (RRN) या ट्रांजैक्शन ID दर्ज करें।'
        ];
    }
    return ['valid' => true, 'utr' => $cleanUtr];
}
