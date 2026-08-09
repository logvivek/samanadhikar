<?php
/**
 * Saman Adhikar Party (समान अधिकार पार्टी)
 * Main PHP Application Portal
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$pdo = get_db_connection();

// Fetch Press Releases from DB
$prs = [];
try {
    $stmt = $pdo->query("SELECT * FROM press_releases ORDER BY date DESC LIMIT 6");
    $prs = $stmt->fetchAll();
} catch (Exception $e) {}

// Fetch Total Raised Stats
$totalRaised = 458500;
$donorCount = 3844;
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count, SUM(amount) as total FROM donations");
    $row = $stmt->fetch();
    if ($row && $row['count'] > 0) {
        $donorCount += intval($row['count']);
        $totalRaised += floatval($row['total']);
    }
} catch (Exception $e) {}
?>
<!DOCTYPE html>
<html lang="hi" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($PARTY_INFO['name']); ?> | <?php echo htmlspecialchars($PARTY_INFO['nameEnglish']); ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', 'Tiro Devanagari Hindi', sans-serif; }
    </style>
</head>
<body class="bg-orange-50/30 text-slate-900 selection:bg-orange-500 selection:text-white">

    <!-- Top Announcement Bar -->
    <div class="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white text-xs md:text-sm font-semibold py-2 px-4 shadow-sm">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <div class="flex items-center space-x-2">
                <span class="bg-white text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">संकल्प</span>
                <span><?php echo htmlspecialchars($PARTY_INFO['primarySlogan']); ?></span>
            </div>
            <div class="flex items-center space-x-4 text-xs">
                <span><i class="fa-solid fa-phone mr-1"></i> <?php echo htmlspecialchars($PARTY_INFO['contactPhone1']); ?>, <?php echo htmlspecialchars($PARTY_INFO['contactPhone2']); ?></span>
                <span class="hidden sm:inline"><i class="fa-solid fa-building-columns mr-1"></i> मुख्यालय: <?php echo htmlspecialchars($PARTY_INFO['headquarters']); ?></span>
            </div>
        </div>
    </div>

    <!-- Main Navigation Header -->
    <nav class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-20">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-orange-200">
                        SAP
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-slate-900 leading-tight"><?php echo htmlspecialchars($PARTY_INFO['name']); ?></h1>
                        <p class="text-xs font-medium text-orange-600"><?php echo htmlspecialchars($PARTY_INFO['motto']); ?></p>
                    </div>
                </div>

                <div class="hidden lg:flex items-center space-x-6 text-sm font-semibold text-slate-700">
                    <a href="#platform" class="hover:text-orange-600 transition">नीति व संकल्प</a>
                    <a href="press.php" class="hover:text-orange-600 transition">प्रेस विज्ञप्ति</a>
                    <a href="events.php" class="hover:text-orange-600 transition">कार्यक्रम व रैलियां</a>
                    <a href="membership.php" class="hover:text-orange-600 transition">सदस्यता लें</a>
                    <a href="donate.php" class="hover:text-orange-600 transition">दान करें</a>
                    <a href="admin.php" class="text-slate-500 hover:text-slate-900"><i class="fa-solid fa-lock text-xs"></i> एडमिन</a>
                </div>

                <div class="flex items-center space-x-3">
                    <a href="donate.php" class="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2 text-sm">
                        <i class="fa-solid fa-hand-holding-heart"></i>
                        <span>दान करें (Donate)</span>
                    </a>
                </div>
            </div>
        </div>
    </nav>

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
                        <?php echo htmlspecialchars($PARTY_INFO['shortBio']); ?>
                    </p>

                    <!-- Key Agendas Checklist -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <?php foreach ($PARTY_INFO['coreAgendasList'] as $agenda): ?>
                        <div class="flex items-start space-x-2 text-sm text-slate-800 font-medium">
                            <i class="fa-solid fa-circle-check text-orange-500 mt-1"></i>
                            <span><?php echo htmlspecialchars($agenda); ?></span>
                        </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="flex flex-wrap gap-4 pt-4">
                        <a href="membership.php" class="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-orange-200 transition flex items-center space-x-2">
                            <i class="fa-solid fa-user-plus"></i>
                            <span>पार्टी से जुड़ें (Join Party)</span>
                        </a>
                        <a href="donate.php" class="bg-white hover:bg-orange-50 border border-orange-300 text-slate-800 font-bold px-6 py-3 rounded-xl shadow-sm transition flex items-center space-x-2">
                            <i class="fa-solid fa-indian-rupee-sign text-orange-600"></i>
                            <span>आर्थिक सहयोग दें</span>
                        </a>
                    </div>
                </div>

                <!-- Leader Profile & Campaign Highlights -->
                <div class="lg:col-span-5">
                    <div class="bg-white rounded-3xl p-6 shadow-xl border border-orange-200 relative">
                        <div class="absolute -top-4 -right-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-extrabold text-xs uppercase px-4 py-1.5 rounded-full shadow-md">
                            राष्ट्रीय अध्यक्ष
                        </div>

                        <div class="text-center space-y-3">
                            <div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-amber-600 p-1 shadow-lg">
                                <div class="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-orange-800 font-black text-3xl">
                                    <i class="fa-solid fa-user-tie"></i>
                                </div>
                            </div>

                            <h3 class="text-2xl font-bold text-slate-900"><?php echo htmlspecialchars($PARTY_INFO['leaderName']); ?></h3>
                            <p class="text-xs font-bold text-orange-600 uppercase tracking-widest"><?php echo htmlspecialchars($PARTY_INFO['leaderRole']); ?></p>

                            <div class="bg-orange-50 p-4 rounded-2xl border border-orange-200 text-sm text-slate-700 italic">
                                "<?php echo htmlspecialchars($PARTY_INFO['primarySlogan']); ?>"
                            </div>

                            <div class="grid grid-cols-2 gap-3 pt-2 text-center">
                                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <div class="text-2xl font-black text-orange-600">₹<?php echo number_format($totalRaised); ?></div>
                                    <div class="text-xs font-semibold text-slate-500">कुल एकत्रित दान</div>
                                </div>
                                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <div class="text-2xl font-black text-amber-600"><?php echo number_format($donorCount); ?>+</div>
                                    <div class="text-xs font-semibold text-slate-500">सक्रिय समर्थक</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- Latest Press Releases Section -->
    <section class="py-16 bg-white border-b border-orange-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col md:flex-row md:items-end justify-between mb-10">
                <div>
                    <span class="text-orange-600 font-extrabold text-xs uppercase tracking-wider">ताज़ा समाचार</span>
                    <h2 class="text-3xl font-extrabold text-slate-900 mt-1">आधिकारिक प्रेस विज्ञप्ति एवं बयान</h2>
                </div>
                <a href="press.php" class="text-orange-600 hover:text-orange-700 font-bold text-sm mt-2 md:mt-0 flex items-center space-x-1">
                    <span>सभी विज्ञप्तियां देखें</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <?php if (empty($prs)): ?>
                    <div class="col-span-3 text-center py-12 text-slate-500 bg-orange-50/50 rounded-2xl">
                        कोई प्रेस विज्ञप्ति उपलब्ध नहीं है। एडमिन पैनल से नई विज्ञप्ति जोड़ें।
                    </div>
                <?php else: ?>
                    <?php foreach ($prs as $pr): ?>
                    <div class="bg-white rounded-2xl border border-orange-200 overflow-hidden shadow-sm hover:shadow-md transition">
                        <div class="p-6 space-y-3">
                            <div class="flex items-center justify-between text-xs font-semibold text-slate-500">
                                <span class="bg-orange-100 text-orange-800 px-2.5 py-1 rounded-full"><?php echo htmlspecialchars($pr['category'] ?? 'Press Release'); ?></span>
                                <span><i class="fa-regular fa-calendar mr-1"></i> <?php echo htmlspecialchars($pr['date']); ?></span>
                            </div>

                            <h3 class="text-lg font-bold text-slate-900 line-clamp-2"><?php echo htmlspecialchars($pr['title']); ?></h3>
                            <p class="text-slate-600 text-sm line-clamp-3 leading-relaxed"><?php echo htmlspecialchars($pr['content']); ?></p>

                            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <span><i class="fa-solid fa-user-pen mr-1"></i> <?php echo htmlspecialchars($pr['spokesperson']); ?></span>
                                <span><i class="fa-solid fa-location-dot mr-1"></i> <?php echo htmlspecialchars($pr['location']); ?></span>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-900 text-slate-300 py-12 border-t-4 border-orange-500">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="space-y-3">
                <h3 class="text-xl font-bold text-white"><?php echo htmlspecialchars($PARTY_INFO['name']); ?></h3>
                <p class="text-xs text-slate-400 leading-relaxed"><?php echo htmlspecialchars($PARTY_INFO['shortBio']); ?></p>
            </div>
            <div class="space-y-2">
                <h4 class="text-sm font-bold text-orange-400 uppercase tracking-wider">त्वरित लिंक्स</h4>
                <ul class="space-y-1.5 text-xs font-medium">
                    <li><a href="press.php" class="hover:text-white transition">प्रेस विज्ञप्ति (Press Releases)</a></li>
                    <li><a href="donate.php" class="hover:text-white transition">दान पोर्टल (Donate Online)</a></li>
                    <li><a href="membership.php" class="hover:text-white transition">सदस्यता अभियान (Member Registration)</a></li>
                    <li><a href="events.php" class="hover:text-white transition">कार्यक्रम व रैलियां (Event Schedule)</a></li>
                    <li><a href="admin.php" class="hover:text-white transition">एडमिन पोर्टल (Admin Login)</a></li>
                </ul>
            </div>
            <div class="space-y-2">
                <h4 class="text-sm font-bold text-orange-400 uppercase tracking-wider">संपर्क व बैंक जानकारी</h4>
                <p class="text-xs"><i class="fa-solid fa-building-columns text-orange-500 mr-2"></i> SBI खाता: 34465318239 | IFSC: SBIN0002467</p>
                <p class="text-xs"><i class="fa-solid fa-qrcode text-orange-500 mr-2"></i> UPI ID: samanadhikarparty@sbi</p>
                <p class="text-xs"><i class="fa-solid fa-phone text-orange-500 mr-2"></i> संपर्क: 9412165541, 7310732088</p>
            </div>
        </div>
        <div class="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            © <?php echo date('Y'); ?> <?php echo htmlspecialchars($PARTY_INFO['name']); ?> (Saman Adhikar Party). सर्वाधिकार सुरक्षित।
        </div>
    </footer>

</body>
</html>
