<?php
/**
 * Event Schedule & RSVP Ticket Pass Generator in PHP
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$pdo = get_db_connection();
$ticket = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['attendeeName'] ?? '');
    $eventTitle = $_POST['eventTitle'] ?? 'विशाल जनसभा व रैली';
    if ($name) {
        $token = 'PASS-' . strtoupper(substr(md5(uniqid()), 0, 8));
        $stmt = $pdo->prepare("INSERT INTO rsvps (id, event_id, event_title, attendee_name, attendee_email, guests_count, qr_code_token, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            'RSVP-' . substr(time(), -6),
            'EVT-101',
            $eventTitle,
            $name,
            $_POST['email'] ?? '',
            intval($_POST['guests'] ?? 1),
            $token,
            date('Y-m-d H:i:s')
        ]);

        $ticket = [
            'token' => $token,
            'event' => $eventTitle,
            'name' => $name,
            'guests' => intval($_POST['guests'] ?? 1),
            'date' => date('d M Y')
        ];
    }
}
?>
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>कार्यक्रम व रैलियां | समान अधिकार पार्टी</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-orange-50/20 text-slate-900">

    <nav class="bg-white border-b border-orange-100 py-4 px-6 flex justify-between items-center">
        <a href="index.php" class="font-bold text-lg text-slate-900 flex items-center space-x-2">
            <div class="w-8 h-8 bg-orange-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">SAP</div>
            <span>समान अधिकार पार्टी</span>
        </a>
        <a href="index.php" class="text-xs font-bold text-orange-600">मुख्य पृष्ठ</a>
    </nav>

    <div class="max-w-4xl mx-auto px-4 py-10">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-extrabold text-slate-900">आगामी कार्यक्रम व महापंचायत</h1>
            <p class="text-slate-600 text-sm mt-1">कुलदीप शर्मा जी की जनसभाओं में सम्मिलित होने हेतु निःशुल्क VIP पास प्राप्त करें।</p>
        </div>

        <?php if ($ticket): ?>
            <div class="max-w-md mx-auto bg-white p-6 rounded-3xl border-2 border-orange-300 shadow-xl text-center space-y-4">
                <i class="fa-solid fa-ticket text-4xl text-orange-600"></i>
                <h2 class="text-xl font-bold text-slate-900">आपका पास जनरेट हो गया!</h2>
                <div class="bg-orange-50 p-4 rounded-2xl text-xs space-y-1 text-left border border-orange-200">
                    <div><strong>पास नंबर:</strong> <span class="font-mono text-orange-700 font-bold"><?php echo $ticket['token']; ?></span></div>
                    <div><strong>कार्यक्रम:</strong> <?php echo htmlspecialchars($ticket['event']); ?></div>
                    <div><strong>अतिथि नाम:</strong> <?php echo htmlspecialchars($ticket['name']); ?></div>
                    <div><strong>सदस्यों की संख्या:</strong> <?php echo $ticket['guests']; ?> व्यक्ति</div>
                    <div><strong>जारी तिथि:</strong> <?php echo $ticket['date']; ?></div>
                </div>
                <button onclick="window.print()" class="bg-orange-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl">पास प्रिंट करें</button>
            </div>
        <?php else: ?>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Event 1 -->
                <div class="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm space-y-3">
                    <span class="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">महापंचायत व रैली</span>
                    <h3 class="text-lg font-bold text-slate-900">आरक्षण मुक्ति एवं हिंदू राष्ट्र जनसभा</h3>
                    <p class="text-xs text-slate-600"><i class="fa-solid fa-location-dot text-orange-600 mr-1"></i> आगरा कोठी मीना बाज़ार मैदान, आगरा</p>
                    <p class="text-xs text-slate-600"><i class="fa-regular fa-clock text-orange-600 mr-1"></i> 15 अगस्त 2026, सुबह 10:00 बजे से</p>
                    <form method="POST" action="events.php" class="pt-2 space-y-2 text-xs">
                        <input type="hidden" name="eventTitle" value="आरक्षण मुक्ति एवं हिंदू राष्ट्र जनसभा - आगरा">
                        <input type="text" name="attendeeName" required placeholder="आपका नाम" class="w-full border p-2 rounded-xl border-slate-300">
                        <button type="submit" class="w-full bg-orange-600 text-white font-bold py-2.5 rounded-xl hover:bg-orange-700">VIP एंट्री पास लें</button>
                    </form>
                </div>

                <!-- Event 2 -->
                <div class="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm space-y-3">
                    <span class="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">मथुरा मंदिर संकल्प</span>
                    <h3 class="text-lg font-bold text-slate-900">श्री कृष्ण जन्मभूमि पुनरोद्धार पदयात्रा</h3>
                    <p class="text-xs text-slate-600"><i class="fa-solid fa-location-dot text-amber-600 mr-1"></i> विश्राम घाट से श्री कृष्ण जन्मस्थान, मथुरा</p>
                    <p class="text-xs text-slate-600"><i class="fa-regular fa-clock text-amber-600 mr-1"></i> 25 अगस्त 2026, शाम 04:00 बजे से</p>
                    <form method="POST" action="events.php" class="pt-2 space-y-2 text-xs">
                        <input type="hidden" name="eventTitle" value="श्री कृष्ण जन्मभूमि पदयात्रा - मथुरा">
                        <input type="text" name="attendeeName" required placeholder="आपका नाम" class="w-full border p-2 rounded-xl border-slate-300">
                        <button type="submit" class="w-full bg-amber-600 text-white font-bold py-2.5 rounded-xl hover:bg-amber-700">पदयात्रा पास लें</button>
                    </form>
                </div>
            </div>
        <?php endif; ?>
    </div>

</body>
</html>
