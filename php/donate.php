<?php
/**
 * Donation Portal & Receipt Generator in PHP
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$pdo = get_db_connection();
$message = '';
$receipt = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $amount = floatval($_POST['amount'] ?? 0);
    $donorName = trim($_POST['donorName'] ?? '');
    $utrNumber = trim($_POST['utrNumber'] ?? '');
    $isAnonymous = !empty($_POST['isAnonymous']);

    if ($amount <= 0) {
        $message = 'कृपया मान्य दान राशि दर्ज करें।';
    } else {
        $utrCheck = validate_utr($utrNumber);
        if (!$utrCheck['valid']) {
            $message = $utrCheck['error'];
        } else {
            $id = 'DON-' . rand(1000, 9990);
            $finalName = $isAnonymous ? 'गुप्त राष्ट्रभक्त (Anonymous Patriot)' : ($donorName ?: 'समर्थक');
            
            $stmt = $pdo->prepare("INSERT INTO donations (id, donor_name, amount, frequency, precinct, timestamp, is_anonymous, message, payment_method, utr_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $finalName,
                $amount,
                $_POST['frequency'] ?? 'one-time',
                $_POST['precinct'] ?? 'आगरा HQ',
                date('Y-m-d H:i:s'),
                $isAnonymous ? 1 : 0,
                $_POST['msg'] ?? '',
                'UPI / SBI',
                $utrCheck['utr']
            ]);

            $receipt = [
                'receiptNumber' => 'REC-SAP-' . substr(time(), -6),
                'donorName' => $finalName,
                'amount' => $amount,
                'utr' => $utrCheck['utr'],
                'date' => date('d M Y, h:i A')
            ];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>दान पोर्टल | समान अधिकार पार्टी</title>
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
            <h1 class="text-3xl font-extrabold text-slate-900">राष्ट्र निर्माण हेतु दान दें</h1>
            <p class="text-slate-600 text-sm mt-1">आरक्षण मुक्त भारत, हिंदू राष्ट्र संकल्प एवं गौ-संरक्षण हेतु आपका योगदान अमूल्य है।</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- SBI Bank Details -->
            <div class="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm space-y-4">
                <h2 class="text-base font-bold text-orange-700 flex items-center">
                    <i class="fa-solid fa-building-columns mr-2"></i> बैंक विवरण (SBI Official Account)
                </h2>
                <div class="bg-orange-50 p-4 rounded-2xl space-y-2 text-xs font-medium text-slate-800">
                    <div><strong>बैंक का नाम:</strong> <?php echo htmlspecialchars($PARTY_INFO['bankDetails']['bankName']); ?></div>
                    <div><strong>शाखा:</strong> <?php echo htmlspecialchars($PARTY_INFO['bankDetails']['branch']); ?></div>
                    <div><strong>खाता संख्या (A/C):</strong> <span class="text-orange-700 font-bold"><?php echo htmlspecialchars($PARTY_INFO['bankDetails']['accountNo']); ?></span></div>
                    <div><strong>IFSC Code:</strong> <span class="text-orange-700 font-bold"><?php echo htmlspecialchars($PARTY_INFO['bankDetails']['ifscCode']); ?></span></div>
                    <div><strong>UPI ID:</strong> <span class="text-orange-700 font-bold"><?php echo htmlspecialchars($PARTY_INFO['bankDetails']['upiId']); ?></span></div>
                </div>
                <div class="text-xs text-slate-500 italic">
                    * PhonePe, Paytm, Google Pay अथवा SBI YONO द्वारा सीधे ट्रांसफर करें और UTR नंबर दर्ज करके तुरंत डिजिटल रसीद प्राप्त करें।
                </div>
            </div>

            <!-- Donation Form / Receipt -->
            <div class="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm">
                <?php if ($receipt): ?>
                    <div class="text-center space-y-4 bg-green-50 p-6 rounded-2xl border border-green-200">
                        <i class="fa-solid fa-circle-check text-4xl text-green-600"></i>
                        <h2 class="text-xl font-bold text-slate-900">दान रसीद जनरेट हो गई!</h2>
                        <div class="text-xs space-y-1 text-slate-700 text-left bg-white p-4 rounded-xl border">
                            <div><strong>रसीद संख्या:</strong> <?php echo $receipt['receiptNumber']; ?></div>
                            <div><strong>दानदाता:</strong> <?php echo htmlspecialchars($receipt['donorName']); ?></div>
                            <div><strong>राशि:</strong> ₹<?php echo number_format($receipt['amount']); ?></div>
                            <div><strong>UTR / TXN ID:</strong> <?php echo htmlspecialchars($receipt['utr']); ?></div>
                            <div><strong>दिनांक:</strong> <?php echo $receipt['date']; ?></div>
                        </div>
                        <button onclick="window.print()" class="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl">रसीद प्रिंट करें</button>
                    </div>
                <?php else: ?>
                    <?php if ($message): ?>
                        <div class="bg-red-100 text-red-800 text-xs font-bold p-3 rounded-xl mb-4"><?php echo $message; ?></div>
                    <?php endif; ?>

                    <form method="POST" action="donate.php" class="space-y-3 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">दान राशि (Amount in ₹)</label>
                            <input type="number" name="amount" required placeholder="5100" class="w-full border p-2.5 rounded-xl border-slate-300">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">आपका नाम (Donor Name)</label>
                            <input type="text" name="donorName" placeholder="रमेश शर्मा" class="w-full border p-2.5 rounded-xl border-slate-300">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">PhonePe/Paytm UTR या TXN ID (12-Digits)</label>
                            <input type="text" name="utrNumber" placeholder="420192847120" required class="w-full border p-2.5 rounded-xl border-slate-300">
                        </div>
                        <div class="flex items-center space-x-2">
                            <input type="checkbox" name="isAnonymous" id="anon" value="1">
                            <label for="anon" class="font-bold text-slate-700">नाम गुप्त रखें (Anonymous Donation)</label>
                        </div>
                        <button type="submit" class="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700">
                            दान पुष्टि करें व रसीद प्राप्त करें
                        </button>
                    </form>
                <?php endif; ?>
            </div>
        </div>
    </div>

</body>
</html>
