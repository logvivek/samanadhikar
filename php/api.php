<?php
/**
 * REST API Endpoint Router for Saman Adhikar Party PHP Backend
 * Handles /api/press-releases, /api/donations, /api/members, /api/events/rsvp, /api/chat
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/ai_assistant.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-Token, Authorization");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$pdo = get_db_connection();

// Route: Admin Login
if ($action === 'admin_login' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
        json_response([
            'success' => true,
            'token' => ADMIN_SECRET_TOKEN,
            'message' => 'एडमिन लॉगिन सफल!',
            'username' => ADMIN_USERNAME
        ]);
    } else {
        json_response([
            'success' => false,
            'error' => 'अवैध एडमिन यूज़रनेम या पासवर्ड।'
        ], 401);
    }
}

// Route: AI Chat
if ($action === 'chat' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $message = trim($input['message'] ?? '');
    $history = $input['history'] ?? [];

    if (empty($message)) {
        json_response(['error' => 'Message field is required.'], 400);
    }

    $reply = ask_gemini_assistant($message, $history);
    json_response(['reply' => $reply]);
}

// Route: Press Releases
if ($action === 'press_releases') {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM press_releases ORDER BY date DESC");
        $prs = $stmt->fetchAll();
        json_response([
            'success' => true,
            'count' => count($prs),
            'pressReleases' => $prs
        ]);
    } else if ($method === 'POST') {
        // Verify Admin Token
        $headers = getallheaders();
        $token = $headers['X-Admin-Token'] ?? $headers['x-admin-token'] ?? '';
        if ($token !== ADMIN_SECRET_TOKEN) {
            json_response(['error' => 'केवल अधिकृत एडमिन ही प्रेस विज्ञप्ति प्रकाशित कर सकते हैं।'], 401);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $id = 'PR-' . substr(time(), -6);
        $title = trim($input['title'] ?? '');
        $content = trim($input['content'] ?? '');

        if (!$title || !$content) {
            json_response(['error' => 'शीर्षक और विवरण आवश्यक हैं।'], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO press_releases (id, title, title_en, content, content_en, category, date, location, spokesperson, image_url, is_urgent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $title,
            $input['titleEn'] ?? '',
            $content,
            $input['contentEn'] ?? '',
            $input['category'] ?? 'Public Announcement',
            $input['date'] ?? date('Y-m-d'),
            $input['location'] ?? 'आगरा / नई दिल्ली',
            $input['spokesperson'] ?? 'कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)',
            $input['imageUrl'] ?? 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
            !empty($input['isUrgent']) ? 1 : 0
        ]);

        json_response([
            'success' => true,
            'message' => 'प्रेस विज्ञप्ति सफलतापूर्वक प्रकाशित की गई!'
        ]);
    }
}

// Route: Donations
if ($action === 'donations') {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM donations ORDER BY timestamp DESC LIMIT 20");
        $donations = $stmt->fetchAll();
        json_response([
            'totalRaised' => 458500,
            'goal' => 2500000,
            'donorCount' => count($donations) + 3800,
            'recentDonations' => $donations,
            'bankInfo' => $PARTY_INFO['bankDetails']
        ]);
    } else if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $amount = floatval($input['amount'] ?? 0);
        
        if ($amount <= 0) {
            json_response(['error' => 'कृपया मान्य दान राशि दर्ज करें।'], 400);
        }

        $utrCheck = validate_utr($input['utrNumber'] ?? '');
        if (!$utrCheck['valid']) {
            json_response(['error' => $utrCheck['error']], 400);
        }

        $id = 'DON-' . rand(1000, 9990);
        $donorName = !empty($input['isAnonymous']) ? 'गुप्त राष्ट्रभक्त (Anonymous Patriot)' : ($input['donorName'] ?? 'समर्थक');

        $stmt = $pdo->prepare("INSERT INTO donations (id, donor_name, amount, frequency, precinct, timestamp, is_anonymous, message, payment_method, utr_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $donorName,
            $amount,
            $input['frequency'] ?? 'one-time',
            $input['precinct'] ?? 'आगरा HQ',
            date('c'),
            !empty($input['isAnonymous']) ? 1 : 0,
            $input['message'] ?? '',
            $input['paymentMethod'] ?? 'UPI / GPay / PhonePe / SBI',
            $utrCheck['utr']
        ]);

        json_response([
            'success' => true,
            'receipt' => [
                'receiptNumber' => 'REC-SAP-' . substr(time(), -6),
                'transactionId' => 'TXN-SAP-' . strtoupper(substr(md5(uniqid()), 0, 9)),
                'amount' => $amount,
                'donorName' => $donorName,
                'date' => date('d M Y, h:i A'),
                'organization' => 'समान अधिकार पार्टी (SAMAN ADHIKAR PARTY)',
                'paymentMethod' => 'UPI / SBI Bank Transfer',
                'paymentRef' => $utrCheck['utr']
            ]
        ]);
    }
}

// Route: Members
if ($action === 'members') {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM members ORDER BY joined_date DESC");
        $members = $stmt->fetchAll();
        json_response([
            'totalMembers' => count($members) + 15400,
            'members' => $members
        ]);
    } else if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $fullName = trim($input['fullName'] ?? '');
        $phone = trim($input['phone'] ?? '');

        if (!$fullName || !$phone) {
            json_response(['error' => 'नाम एवं मोबाइल नंबर अनिवार्य हैं।'], 400);
        }

        $cardId = 'SAP-2026-' . rand(1000, 9990);
        $stmt = $pdo->prepare("INSERT INTO members (id, full_name, email, phone, precinct, membership_tier, interests, joined_date, member_card_id, membership_fee, payment_method, utr_number, is_fee_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            'MEM-' . rand(1000, 9990),
            $fullName,
            $input['email'] ?? 'member@samanadhikarparty.org',
            $phone,
            $input['precinct'] ?? 'आगरा-मथुरा मंडल',
            $input['membershipTier'] ?? 'सक्रिय कार्यकर्ता (Active Worker)',
            is_array($input['interests'] ?? null) ? implode(', ', $input['interests']) : 'घर-घर जनसंपर्क',
            date('Y-m-d'),
            $cardId,
            floatval($input['membershipFee'] ?? 0),
            $input['paymentMethod'] ?? 'UPI / PhonePe',
            $input['utrNumber'] ?? '',
            1
        ]);

        json_response([
            'success' => true,
            'message' => 'समान अधिकार पार्टी में आपका हार्दिक स्वागत है! आपका डिजिटल आईडी कार्ड बन गया है।',
            'memberCardId' => $cardId
        ]);
    }
}

// Default Fallback
json_response(['status' => 'Saman Adhikar Party PHP API Ready']);
