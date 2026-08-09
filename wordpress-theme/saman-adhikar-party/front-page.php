<?php
/**
 * Main Front Page Template for WordPress Theme
 */
get_header();
?>

<!-- Hero Section -->
<section class="relative bg-gradient-to-b from-orange-100/60 via-orange-50/20 to-transparent py-16 lg:py-24 overflow-hidden border-b border-orange-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div class="lg:col-span-7 space-y-6">
                <div class="inline-flex items-center space-x-2 bg-orange-100 border border-orange-300 text-orange-800 text-xs font-bold px-3 py-1.5 rounded-full">
                    <i class="fa-solid fa-flag text-orange-600"></i>
                    <span>राष्ट्रीय आंदोलन - कुलदीप शर्मा जी के नेतृत्व में</span>
                </div>

                <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
                    समान अधिकार पाना है,<br>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-red-600">श्रेष्ठ भारत बनाना है!</span>
                </h1>

                <p class="text-slate-700 text-base sm:text-lg leading-relaxed">
                    समान अधिकार पार्टी (Saman Adhikar Party) समाज के हर वर्ग के लिए न्याय, योग्यता-आधारित अधिकार, आरक्षण-मुक्त व्यवस्था, सांस्कृतिक हिंदू राष्ट्र निर्माण एवं गौ-संरक्षण हेतु संकल्पित है।
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div class="flex items-start space-x-2 text-sm text-slate-800 font-medium">
                        <i class="fa-solid fa-circle-check text-orange-500 mt-1"></i>
                        <span>आरक्षण प्रणाली समाप्त कर योग्यता को प्राथमिकता</span>
                    </div>
                    <div class="flex items-start space-x-2 text-sm text-slate-800 font-medium">
                        <i class="fa-solid fa-circle-check text-orange-500 mt-1"></i>
                        <span>भारत को संवैधानिक हिंदू राष्ट्र घोषित करना</span>
                    </div>
                    <div class="flex items-start space-x-2 text-sm text-slate-800 font-medium">
                        <i class="fa-solid fa-circle-check text-orange-500 mt-1"></i>
                        <span>जनसंख्या नियंत्रण कानून 'दो बच्चे' का नियम</span>
                    </div>
                    <div class="flex items-start space-x-2 text-sm text-slate-800 font-medium">
                        <i class="fa-solid fa-circle-check text-orange-500 mt-1"></i>
                        <span>गौमाता को राष्ट्रमाता का दर्जा एवं गोवंश रक्षा</span>
                    </div>
                </div>

                <div class="flex flex-wrap gap-4 pt-4">
                    <a href="<?php echo site_url('/membership'); ?>" class="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-orange-200 transition flex items-center space-x-2">
                        <i class="fa-solid fa-user-plus"></i>
                        <span>पार्टी से जुड़ें (Join Party)</span>
                    </a>
                    <a href="<?php echo site_url('/donate'); ?>" class="bg-white hover:bg-orange-50 border border-orange-300 text-slate-800 font-bold px-6 py-3 rounded-xl shadow-sm transition flex items-center space-x-2">
                        <i class="fa-solid fa-indian-rupee-sign text-orange-600"></i>
                        <span>आर्थिक सहयोग दें</span>
                    </a>
                </div>
            </div>

            <div class="lg:col-span-5">
                <div class="bg-white rounded-3xl p-6 shadow-xl border border-orange-200 relative text-center space-y-4">
                    <div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-amber-600 p-1 shadow-lg">
                        <div class="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-orange-800 font-black text-3xl">
                            <i class="fa-solid fa-user-tie"></i>
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-900">कुलदीप शर्मा (Kuldeep Sharma)</h3>
                    <p class="text-xs font-bold text-orange-600 uppercase tracking-widest">राष्ट्रीय अध्यक्ष (National President)</p>
                    <div class="bg-orange-50 p-4 rounded-2xl border border-orange-200 text-sm text-slate-700 italic">
                        "तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा!"
                    </div>
                </div>
            </div>

        </div>
    </div>
</section>

<!-- Latest Press Releases CPT Query -->
<section class="py-16 bg-white border-b border-orange-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
            <h2 class="text-3xl font-extrabold text-slate-900">आधिकारिक प्रेस विज्ञप्ति</h2>
            <a href="<?php echo get_post_type_archive_link('press_release'); ?>" class="text-orange-600 font-bold text-sm">सभी देखें &rarr;</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <?php
            $pr_query = new WP_Query(array('post_type' => 'press_release', 'posts_per_page' => 3));
            if ($pr_query->have_posts()) :
                while ($pr_query->have_posts()) : $pr_query->the_post();
            ?>
                <div class="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm">
                    <div class="text-xs font-semibold text-slate-500 mb-2"><?php echo get_the_date(); ?></div>
                    <h3 class="text-lg font-bold text-slate-900 mb-2"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                    <div class="text-xs text-slate-600 line-clamp-3"><?php the_excerpt(); ?></div>
                </div>
            <?php
                endwhile;
                wp_reset_postdata();
            else :
            ?>
                <div class="col-span-3 text-center py-8 text-slate-500">कोई प्रेस विज्ञप्ति उपलब्ध नहीं है। WP Admin से जोड़ें।</div>
            <?php endif; ?>
        </div>
    </div>
</section>

<?php get_footer(); ?>
