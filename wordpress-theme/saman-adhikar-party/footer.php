<!-- Footer -->
<footer class="bg-slate-900 text-slate-300 py-12 border-t-4 border-orange-500">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="space-y-3">
            <h3 class="text-xl font-bold text-white"><?php bloginfo('name'); ?></h3>
            <p class="text-xs text-slate-400 leading-relaxed">
                राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी के नेतृत्व में आरक्षण मुक्त भारत, सांस्कृतिक हिंदू राष्ट्र एवं गौ-संरक्षण हेतु समर्पित आंदोलन।
            </p>
        </div>
        <div class="space-y-2">
            <h4 class="text-sm font-bold text-orange-400 uppercase tracking-wider">त्वरित लिंक्स</h4>
            <ul class="space-y-1.5 text-xs font-medium">
                <li><a href="<?php echo get_post_type_archive_link('press_release'); ?>" class="hover:text-white transition">प्रेस विज्ञप्ति (Press Releases)</a></li>
                <li><a href="<?php echo site_url('/donate'); ?>" class="hover:text-white transition">दान पोर्टल (Online Donation)</a></li>
                <li><a href="<?php echo site_url('/membership'); ?>" class="hover:text-white transition">सदस्यता लें (Join Member)</a></li>
                <li><a href="<?php echo wp_login_url(); ?>" class="hover:text-white transition">WordPress एडमिन पैनल</a></li>
            </ul>
        </div>
        <div class="space-y-2">
            <h4 class="text-sm font-bold text-orange-400 uppercase tracking-wider">संपर्क व बैंक जानकारी</h4>
            <p class="text-xs"><i class="fa-solid fa-building-columns text-orange-500 mr-2"></i> SBI खाता: <?php echo esc_html(get_option('sap_account_no', '34465318239')); ?></p>
            <p class="text-xs"><i class="fa-solid fa-qrcode text-orange-500 mr-2"></i> UPI ID: <?php echo esc_html(get_option('sap_upi_id', 'samanadhikarparty@sbi')); ?></p>
            <p class="text-xs"><i class="fa-solid fa-phone text-orange-500 mr-2"></i> संपर्क: 9412165541, 7310732088</p>
        </div>
    </div>
    <div class="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. सर्वाधिकार सुरक्षित। (WordPress Official Theme)
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
