<?php
/**
 * Dedicated Press Releases & News Portal in PHP
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$pdo = get_db_connection();
$stmt = $pdo->query("SELECT * FROM press_releases ORDER BY date DESC");
$pressReleases = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>प्रेस विज्ञप्ति | समान अधिकार पार्टी</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-orange-50/20 text-slate-900">

    <nav class="bg-white border-b border-orange-100 shadow-sm py-4 px-6 flex items-center justify-between">
        <a href="index.php" class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center font-bold">SAP</div>
            <span class="font-bold text-slate-900 text-lg">समान अधिकार पार्टी - प्रेस पोर्टल</span>
        </a>
        <div class="space-x-4 text-sm font-semibold">
            <a href="index.php" class="text-slate-600 hover:text-orange-600">मुख्य पृष्ठ</a>
            <a href="admin.php" class="bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700">एडमिन लॉगिन</a>
        </div>
    </nav>

    <div class="max-w-6xl mx-auto px-4 py-12">
        <div class="text-center max-w-2xl mx-auto mb-12">
            <span class="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase">आधिकारिक वक्तव्य</span>
            <h1 class="text-3xl font-extrabold text-slate-900 mt-2">प्रेस विज्ञप्तियां एवं मीडिया बुलेटिन</h1>
            <p class="text-slate-600 text-sm mt-1">समान अधिकार पार्टी द्वारा राष्ट्रीय मुद्दों, आंदोलनों एवं संकल्पों पर जारी प्रेस विज्ञप्तियां</p>
        </div>

        <div class="space-y-6">
            <?php foreach ($pressReleases as $pr): ?>
            <div class="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm hover:shadow-md transition">
                <div class="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                    <span class="bg-orange-100 text-orange-800 px-3 py-1 rounded-full"><?php echo htmlspecialchars($pr['category'] ?? 'Public Announcement'); ?></span>
                    <span><i class="fa-regular fa-calendar mr-1"></i> <?php echo htmlspecialchars($pr['date']); ?> | <i class="fa-solid fa-location-dot mr-1"></i> <?php echo htmlspecialchars($pr['location']); ?></span>
                </div>
                <h2 class="text-xl font-bold text-slate-900 mb-2"><?php echo htmlspecialchars($pr['title']); ?></h2>
                <p class="text-slate-700 text-sm leading-relaxed mb-4"><?php echo nl2br(htmlspecialchars($pr['content'])); ?></p>
                <div class="text-xs text-slate-500 font-medium">
                    प्रवक्ता: <span class="font-bold text-slate-800"><?php echo htmlspecialchars($pr['spokesperson']); ?></span>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

</body>
</html>
