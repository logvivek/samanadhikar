<?php
/**
 * Party Member Registration & Digital ID Card Generator in PHP
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$pdo = get_db_connection();
$card = null;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = trim($_POST['fullName'] ?? '');
    $phone = trim($_POST['phone'] ?? '');

    if (!$fullName || !$phone) {
        $error = 'नाम एवं मोबाइल नंबर भरना अनिवार्य है।';
    } else {
        $cardId = 'SAP-2026-' . rand(1000, 9990);
        $stmt = $pdo->prepare("INSERT INTO members (id, full_name, email, phone, precinct, membership_tier, interests, joined_date, member_card_id, membership_fee, payment_method, is_fee_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            'MEM-' . rand(1000, 9990),
            $fullName,
            $_POST['email'] ?? 'member@samanadhikarparty.org',
            $phone,
            $_POST['precinct'] ?? 'आगरा-मथुरा मंडल',
            $_POST['membershipTier'] ?? 'सक्रिय कार्यकर्ता',
            'घर-घर जनसंपर्क',
            date('Y-m-d'),
            $cardId,
            0,
            'Free Registration',
            1
        ]);

        $card = [
            'cardId' => $cardId,
            'name' => $fullName,
            'phone' => $phone,
            'precinct' => $_POST['precinct'] ?? 'आगरा HQ',
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
    <title>सदस्यता पोर्टल | समान अधिकार पार्टी</title>
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

    <div class="max-w-md mx-auto px-4 py-10">
        <?php if ($card): ?>
            <div class="bg-gradient-to-br from-orange-600 via-amber-600 to-red-600 text-white p-6 rounded-3xl shadow-xl border-2 border-amber-300 space-y-4">
                <div class="flex items-center justify-between border-b border-white/20 pb-3">
                    <div>
                        <h2 class="font-bold text-lg leading-tight">समान अधिकार पार्टी</h2>
                        <p class="text-[10px] text-amber-200 uppercase font-semibold">डिजिटल कार्यकर्ता पहचान पत्र</p>
                    </div>
                    <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black">SAP</div>
                </div>

                <div class="space-y-2 text-xs">
                    <div><strong>सदस्य ID:</strong> <span class="bg-white/20 px-2 py-0.5 rounded text-amber-200 font-mono font-bold"><?php echo $card['cardId']; ?></span></div>
                    <div><strong>नाम:</strong> <?php echo htmlspecialchars($card['name']); ?></div>
                    <div><strong>मोबाइल:</strong> <?php echo htmlspecialchars($card['phone']); ?></div>
                    <div><strong>क्षेत्र/मंडल:</strong> <?php echo htmlspecialchars($card['precinct']); ?></div>
                    <div><strong>पंजीकरण तिथि:</strong> <?php echo $card['date']; ?></div>
                </div>

                <div class="bg-white text-slate-900 p-3 rounded-xl text-center text-xs font-bold shadow-inner">
                    "समान अधिकार लाना है, श्रेष्ठ भारत बनाना है!"
                </div>
            </div>
            <div class="mt-4 text-center">
                <button onclick="window.print()" class="bg-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl">कार्ड प्रिंट करें</button>
            </div>
        <?php else: ?>
            <div class="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm space-y-4">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-slate-900">पार्टी सदस्यता फॉर्म</h1>
                    <p class="text-xs text-slate-500">समान अधिकार पार्टी से जुड़ें एवं डिजिटल आईडी कार्ड प्राप्त करें</p>
                </div>

                <?php if ($error): ?>
                    <div class="bg-red-100 text-red-800 text-xs font-bold p-3 rounded-xl"><?php echo $error; ?></div>
                <?php endif; ?>

                <form method="POST" action="membership.php" class="space-y-3 text-xs">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">पूरा नाम (Full Name)</label>
                        <input type="text" name="fullName" required placeholder="कुलदीप शर्मा" class="w-full border p-2.5 rounded-xl border-slate-300">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">मोबाइल नंबर (Phone Number)</label>
                        <input type="tel" name="phone" required placeholder="98370XXXXX" class="w-full border p-2.5 rounded-xl border-slate-300">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">ईमेल (Email Address)</label>
                        <input type="email" name="email" placeholder="example@gmail.com" class="w-full border p-2.5 rounded-xl border-slate-300">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">ज़िला / मंडल (District/Precinct)</label>
                        <input type="text" name="precinct" placeholder="आगरा सदर / मथुरा" class="w-full border p-2.5 rounded-xl border-slate-300">
                    </div>
                    <button type="submit" class="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 shadow-md">
                        सदस्य बनें व ID कार्ड जनरेट करें
                    </button>
                </form>
            </div>
        <?php endif; ?>
    </div>

</body>
</html>
