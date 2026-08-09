<?php
/**
 * Template Name: Events & Ticket Pass
 */
get_header();

$ticket = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sap_rsvp_submit'])) {
    $name = sanitize_text_field($_POST['attendeeName'] ?? '');
    $eventTitle = sanitize_text_field($_POST['eventTitle'] ?? 'विशाल जनसभा व रैली');
    if ($name) {
        $token = 'PASS-WP-' . strtoupper(substr(md5(uniqid()), 0, 8));
        $ticket = array(
            'token' => $token,
            'event' => $eventTitle,
            'name' => $name,
            'date' => date('d M Y')
        );
    }
}
?>

<div class="max-w-4xl mx-auto px-4 py-12">
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
                <div><strong>कार्यक्रम:</strong> <?php echo esc_html($ticket['event']); ?></div>
                <div><strong>अतिथि नाम:</strong> <?php echo esc_html($ticket['name']); ?></div>
                <div><strong>जारी तिथि:</strong> <?php echo $ticket['date']; ?></div>
            </div>
            <button onclick="window.print()" class="bg-orange-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl">पास प्रिंट करें</button>
        </div>
    <?php else: ?>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm space-y-3">
                <span class="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">महापंचायत व रैली</span>
                <h3 class="text-lg font-bold text-slate-900">आरक्षण मुक्ति एवं हिंदू राष्ट्र जनसभा</h3>
                <p class="text-xs text-slate-600"><i class="fa-solid fa-location-dot text-orange-600 mr-1"></i> आगरा कोठी मीना बाज़ार मैदान, आगरा</p>
                <p class="text-xs text-slate-600"><i class="fa-regular fa-clock text-orange-600 mr-1"></i> 15 अगस्त 2026, सुबह 10:00 बजे से</p>
                <form method="POST" action="" class="pt-2 space-y-2 text-xs">
                    <input type="hidden" name="eventTitle" value="आरक्षण मुक्ति एवं हिंदू राष्ट्र जनसभा - आगरा">
                    <input type="text" name="attendeeName" required placeholder="आपका नाम" class="w-full border p-2 rounded-xl border-slate-300">
                    <button type="submit" name="sap_rsvp_submit" class="w-full bg-orange-600 text-white font-bold py-2.5 rounded-xl hover:bg-orange-700">VIP एंट्री पास लें</button>
                </form>
            </div>

            <div class="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm space-y-3">
                <span class="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">मथुरा मंदिर संकल्प</span>
                <h3 class="text-lg font-bold text-slate-900">श्री कृष्ण जन्मभूमि पुनरोद्धार पदयात्रा</h3>
                <p class="text-xs text-slate-600"><i class="fa-solid fa-location-dot text-amber-600 mr-1"></i> विश्राम घाट से श्री कृष्ण जन्मस्थान, मथुरा</p>
                <p class="text-xs text-slate-600"><i class="fa-regular fa-clock text-amber-600 mr-1"></i> 25 अगस्त 2026, शाम 04:00 बजे से</p>
                <form method="POST" action="" class="pt-2 space-y-2 text-xs">
                    <input type="hidden" name="eventTitle" value="श्री कृष्ण जन्मभूमि पदयात्रा - मथुरा">
                    <input type="text" name="attendeeName" required placeholder="आपका नाम" class="w-full border p-2 rounded-xl border-slate-300">
                    <button type="submit" name="sap_rsvp_submit" class="w-full bg-amber-600 text-white font-bold py-2.5 rounded-xl hover:bg-amber-700">पदयात्रा पास लें</button>
                </form>
            </div>
        </div>
    <?php endif; ?>
</div>

<?php get_footer(); ?>
