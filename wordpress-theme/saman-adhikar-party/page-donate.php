<?php
/**
 * Template Name: Donate Portal
 */
get_header();

$bank_name = get_option('sap_bank_name', 'भारतीय स्टेट बैंक (State Bank of India)');
$account_no = get_option('sap_account_no', '34465318239');
$ifsc_code = get_option('sap_ifsc_code', 'SBIN0002467');
$upi_id = get_option('sap_upi_id', 'samanadhikarparty@sbi');

$receipt = null;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sap_donate_submit'])) {
    $amount = floatval($_POST['amount'] ?? 0);
    $utr = strtoupper(trim($_POST['utrNumber'] ?? ''));
    $donor = sanitize_text_field($_POST['donorName'] ?? 'समर्थक');

    if ($amount <= 0 || strlen($utr) < 10) {
        $error = 'कृपया वैध दान राशि एवं 12-अंकीय UTR/Transaction ID दर्ज करें।';
    } else {
        $post_id = wp_insert_post(array(
            'post_title' => 'Donation ₹' . $amount . ' - ' . $donor,
            'post_type' => 'sap_donation',
            'post_status' => 'publish',
        ));

        update_post_meta($post_id, 'donor_name', $donor);
        update_post_meta($post_id, 'amount', $amount);
        update_post_meta($post_id, 'utr_number', $utr);

        $receipt = array(
            'receiptNo' => 'REC-SAP-' . rand(10000, 99999),
            'donor' => $donor,
            'amount' => $amount,
            'utr' => $utr,
            'date' => date('d M Y, h:i A')
        );
    }
}
?>

<div class="max-w-4xl mx-auto px-4 py-12">
    <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900">राष्ट्र निर्माण हेतु दान दें</h1>
        <p class="text-slate-600 text-sm mt-1">आरक्षण मुक्त भारत, हिंदू राष्ट्र संकल्प एवं गौ-संरक्षण हेतु आपका योगदान अमूल्य है।</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm space-y-4">
            <h2 class="text-base font-bold text-orange-700 flex items-center">
                <i class="fa-solid fa-building-columns mr-2"></i> बैंक विवरण (Official SBI)
            </h2>
            <div class="bg-orange-50 p-4 rounded-2xl space-y-2 text-xs font-medium text-slate-800">
                <div><strong>बैंक का नाम:</strong> <?php echo esc_html($bank_name); ?></div>
                <div><strong>खाता संख्या:</strong> <span class="text-orange-700 font-bold"><?php echo esc_html($account_no); ?></span></div>
                <div><strong>IFSC Code:</strong> <span class="text-orange-700 font-bold"><?php echo esc_html($ifsc_code); ?></span></div>
                <div><strong>UPI ID:</strong> <span class="text-orange-700 font-bold"><?php echo esc_html($upi_id); ?></span></div>
            </div>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm">
            <?php if ($receipt): ?>
                <div class="text-center space-y-4 bg-green-50 p-6 rounded-2xl border border-green-200">
                    <i class="fa-solid fa-circle-check text-4xl text-green-600"></i>
                    <h2 class="text-xl font-bold text-slate-900">डिजिटल दान रसीद</h2>
                    <div class="text-xs space-y-1 text-slate-700 text-left bg-white p-4 rounded-xl border">
                        <div><strong>रसीद संख्या:</strong> <?php echo $receipt['receiptNo']; ?></div>
                        <div><strong>दानदाता:</strong> <?php echo esc_html($receipt['donor']); ?></div>
                        <div><strong>राशि:</strong> ₹<?php echo number_format($receipt['amount']); ?></div>
                        <div><strong>UTR / TXN ID:</strong> <?php echo esc_html($receipt['utr']); ?></div>
                        <div><strong>दिनांक:</strong> <?php echo $receipt['date']; ?></div>
                    </div>
                    <button onclick="window.print()" class="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl">प्रिंट करें</button>
                </div>
            <?php else: ?>
                <?php if ($error): ?>
                    <div class="bg-red-100 text-red-800 text-xs font-bold p-3 rounded-xl mb-4"><?php echo $error; ?></div>
                <?php endif; ?>
                <form method="POST" action="" class="space-y-3 text-xs">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">दान राशि (Amount ₹)</label>
                        <input type="number" name="amount" required placeholder="5100" class="w-full border p-2.5 rounded-xl border-slate-300">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">आपका नाम (Donor Name)</label>
                        <input type="text" name="donorName" placeholder="रमेश शर्मा" class="w-full border p-2.5 rounded-xl border-slate-300">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">UTR / Transaction ID (12 Digits)</label>
                        <input type="text" name="utrNumber" required placeholder="420192847120" class="w-full border p-2.5 rounded-xl border-slate-300">
                    </div>
                    <button type="submit" name="sap_donate_submit" class="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700">
                        दान रसीद जनरेट करें
                    </button>
                </form>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php get_footer(); ?>
