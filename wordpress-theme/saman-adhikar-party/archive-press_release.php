<?php
/**
 * Press Releases Archive Template
 */
get_header();
?>

<div class="max-w-6xl mx-auto px-4 py-12">
    <div class="text-center max-w-2xl mx-auto mb-10">
        <span class="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase">मीडिया आर्काइव</span>
        <h1 class="text-3xl font-extrabold text-slate-900 mt-2">प्रेस विज्ञप्तियां एवं आधिकारिक बयान</h1>
        <p class="text-slate-600 text-sm mt-1">समान अधिकार पार्टी द्वारा जारी प्रेस विज्ञप्तियों की सूची</p>
    </div>

    <div class="space-y-6">
        <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
            <div class="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm">
                <div class="text-xs text-slate-500 font-semibold mb-2"><?php echo get_the_date(); ?></div>
                <h2 class="text-xl font-bold text-slate-900 mb-2"><a href="<?php the_permalink(); ?>" class="hover:text-orange-600"><?php the_title(); ?></a></h2>
                <div class="text-slate-700 text-sm leading-relaxed mb-4"><?php the_excerpt(); ?></div>
                <a href="<?php the_permalink(); ?>" class="text-orange-600 font-bold text-xs flex items-center space-x-1">
                    <span>पूरा पढ़ें</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
        <?php endwhile; endif; ?>
    </div>
</div>

<?php get_footer(); ?>
