<?php
/**
 * Template Name: Member Registration & Digital ID Card
 */
get_header();

$card = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sap_member_submit'])) {
    $name = sanitize_text_field($_POST['fullName'] ?? '');
    $phone = sanitize_text_field($_POST['phone'] ?? '');
    $precinct = sanitize_text_field($_POST['precinct'] ?? 'आगरा मंडल');

    if ($name && $phone) {
        $cardId = 'SAP-WP-' . rand(1000, 9999);
        $post_id = wp_insert_post(array(
            'post_title' => $name . ' (' . $cardId . ')',
            'post_type' => 'sap_member',
            'post_status' => 'publish',
        ));
        update_post_meta($post_id, 'phone', $phone);
        update_post_meta($post_id, 'card_id', $cardId);

        $card = array(
            'cardId' => $cardId,
            'name' => $name,
            'phone' => $phone,
            'precinct' => $precinct,
            'date' => date('d M Y')
        );
    }
}
?>

<div class="max-w-md mx-auto px-4 py-12">
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
                <div><strong>नाम:</strong> <?php echo esc_html($card['name']); ?></div>
                <div><strong>मोबाइल:</strong> <?php echo esc_html($card['phone']); ?></div>
                <div><strong>क्षेत्र/मंडल:</strong> <?php echo esc_html($card['precinct']); ?></div>
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

            <form method="POST" action="" class="space-y-3 text-xs">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">पूरा नाम (Full Name)</label>
                    <input type="text" name="fullName" required placeholder="कुलदीप शर्मा" class="w-full border p-2.5 rounded-xl border-slate-300">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">मोबाइल नंबर (Phone)</label>
                    <input type="tel" name="phone" required placeholder="98370XXXXX" class="w-full border p-2.5 rounded-xl border-slate-300">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">ज़िला / मंडल (District)</label>
                    <input type="text" name="precinct" placeholder="आगरा सदर / मथुरा" class="w-full border p-2.5 rounded-xl border-slate-300">
                </div>
                <button type="submit" name="sap_member_submit" class="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 shadow-md">
                    सदस्य बनें व ID कार्ड जनरेट करें
                </button>
            </form>
        </div>
    <?php endif; ?>
</div>

<?php get_footer(); ?>
