<?php
/**
 * Main Template File (Fallback)
 */
get_header();
?>

<div class="max-w-7xl mx-auto px-4 py-12">
    <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
        <article class="bg-white p-8 rounded-3xl border border-orange-200 shadow-sm mb-6">
            <h1 class="text-2xl font-bold text-slate-900 mb-4"><?php the_title(); ?></h1>
            <div class="prose max-w-none text-slate-700 leading-relaxed"><?php the_content(); ?></div>
        </article>
    <?php endwhile; endif; ?>
</div>

<?php get_footer(); ?>
