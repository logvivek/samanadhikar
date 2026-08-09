<!DOCTYPE html>
<html <?php language_attributes(); ?> class="scroll-smooth">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class('bg-orange-50/30 text-slate-900 selection:bg-orange-500 selection:text-white'); ?>>
<?php wp_body_open(); ?>

<!-- Announcement Bar -->
<div class="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white text-xs md:text-sm font-semibold py-2 px-4 shadow-sm">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div class="flex items-center space-x-2">
            <span class="bg-white text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">संकल्प</span>
            <span>तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा</span>
        </div>
        <div class="flex items-center space-x-4 text-xs">
            <span><i class="fa-solid fa-phone mr-1"></i> 9412165541, 7310732088</span>
            <span class="hidden sm:inline"><i class="fa-solid fa-building-columns mr-1"></i> आगरा एवं मथुरा, उत्तर प्रदेश</span>
        </div>
    </div>
</div>

<!-- Main Navbar -->
<nav class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
            <a href="<?php echo home_url('/'); ?>" class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-orange-200">
                    SAP
                </div>
                <div>
                    <h1 class="text-xl font-bold text-slate-900 leading-tight"><?php bloginfo('name'); ?></h1>
                    <p class="text-xs font-medium text-orange-600"><?php bloginfo('description'); ?></p>
                </div>
            </a>

            <div class="hidden lg:flex items-center space-x-6 text-sm font-semibold text-slate-700">
                <a href="<?php echo home_url('/'); ?>" class="hover:text-orange-600 transition">मुख्य पृष्ठ</a>
                <a href="<?php echo get_post_type_archive_link('press_release'); ?>" class="hover:text-orange-600 transition">प्रेस विज्ञप्ति</a>
                <a href="<?php echo site_url('/events'); ?>" class="hover:text-orange-600 transition">कार्यक्रम व रैलियां</a>
                <a href="<?php echo site_url('/membership'); ?>" class="hover:text-orange-600 transition">सदस्यता लें</a>
                <a href="<?php echo site_url('/donate'); ?>" class="hover:text-orange-600 transition">दान करें</a>
            </div>

            <div class="flex items-center space-x-3">
                <a href="<?php echo site_url('/donate'); ?>" class="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2 text-sm">
                    <i class="fa-solid fa-hand-holding-heart"></i>
                    <span>दान करें (Donate)</span>
                </a>
            </div>
        </div>
    </div>
</nav>
