<?php
/**
 * Single Press Release Template
 */
get_header();
?>

<div class="max-w-4xl mx-auto px-4 py-12">
    <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
        <article class="bg-white p-8 rounded-3xl border border-orange-200 shadow-sm space-y-4">
            <div class="text-xs text-orange-600 font-bold uppercase tracking-wider">आधिकारिक प्रेस विज्ञप्ति</div>
            <h1 class="text-3xl font-extrabold text-slate-900"><?php the_title(); ?></h1>
            <div class="text-xs text-slate-500 font-semibold border-b border-orange-100 pb-4">
                प्रकाशित दिनांक: <?php echo get_the_date(); ?> | प्रवक्ता: कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)
            </div>
            <div class="prose max-w-none text-slate-700 leading-relaxed text-sm pt-2">
                <?php the_content(); ?>
            </div>
            <div class="pt-6 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-orange-600">
                <a href="<?php echo get_post_type_archive_link('press_release'); ?>">&larr; सभी प्रेस विज्ञप्तियां</a>
                <button onclick="window.print()" class="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-normal">प्रिंट लें</button>
            </div>
        </article>
    <?php endwhile; endif; ?>
</div>

<?php get_footer(); ?>
