<?php
/**
 * Admin Management Panel for Saman Adhikar Party in PHP
 */
session_start();
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$pdo = get_db_connection();
$error = '';
$success = '';

// Logout Action
if (isset($_GET['logout'])) {
    unset($_SESSION['admin_logged_in']);
    header('Location: admin.php');
    exit;
}

// Login Processing
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $user = trim($_POST['username'] ?? '');
    $pass = trim($_POST['password'] ?? '');

    if ($user === ADMIN_USERNAME && $pass === ADMIN_PASSWORD) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: admin.php');
        exit;
    } else {
        $error = 'अवैध एडमिन यूज़रनेम या पासवर्ड! (डिफ़ॉल्ट: admin / admin123)';
    }
}

// Add Press Release Action
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_press_release'])) {
    if (empty($_SESSION['admin_logged_in'])) {
        die('Unauthorized');
    }

    $title = trim($_POST['title'] ?? '');
    $content = trim($_POST['content'] ?? '');
    $category = $_POST['category'] ?? 'Public Announcement';
    $location = $_POST['location'] ?? 'आगरा / नई दिल्ली';
    $spokesperson = $_POST['spokesperson'] ?? 'कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)';

    if ($title && $content) {
        $stmt = $pdo->prepare("INSERT INTO press_releases (id, title, content, category, date, location, spokesperson, is_urgent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            'PR-' . substr(time(), -6),
            $title,
            $content,
            $category,
            date('Y-m-d'),
            $location,
            $spokesperson,
            !empty($_POST['is_urgent']) ? 1 : 0
        ]);
        $success = 'प्रेस विज्ञप्ति सफलतापूर्वक प्रकाशित कर दी गई!';
    } else {
        $error = 'शीर्षक और विवरण भरना आवश्यक है।';
    }
}

$isLoggedIn = !empty($_SESSION['admin_logged_in']);

// Fetch stats for admin
$members = [];
$donations = [];
if ($isLoggedIn) {
    try {
        $members = $pdo->query("SELECT * FROM members ORDER BY joined_date DESC LIMIT 10")->fetchAll();
        $donations = $pdo->query("SELECT * FROM donations ORDER BY timestamp DESC LIMIT 10")->fetchAll();
    } catch (Exception $e) {}
}
?>
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>एडमिन पोर्टल | समान अधिकार पार्टी</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-100 text-slate-900 min-h-screen">

    <nav class="bg-slate-900 text-white py-4 px-6 flex items-center justify-between border-b-2 border-orange-500">
        <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-bold">SAP</div>
            <span class="font-bold text-lg">समान अधिकार पार्टी - एडमिन पैनल</span>
        </div>
        <div>
            <?php if ($isLoggedIn): ?>
                <a href="admin.php?logout=1" class="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg"><i class="fa-solid fa-right-from-bracket mr-1"></i> लॉगआउट (Logout)</a>
            <?php else: ?>
                <a href="index.php" class="text-xs text-slate-300 hover:text-white">मुख्य वेबसाइट</a>
            <?php endif; ?>
        </div>
    </nav>

    <div class="max-w-6xl mx-auto px-4 py-10">

        <?php if ($error): ?>
            <div class="bg-red-100 border border-red-300 text-red-800 p-4 rounded-xl mb-6 text-sm font-semibold">
                <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>

        <?php if ($success): ?>
            <div class="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl mb-6 text-sm font-semibold">
                <?php echo htmlspecialchars($success); ?>
            </div>
        <?php endif; ?>

        <?php if (!$isLoggedIn): ?>
            <!-- Login Form -->
            <div class="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
                <div class="text-center mb-6">
                    <i class="fa-solid fa-user-shield text-4xl text-orange-600 mb-2"></i>
                    <h1 class="text-2xl font-bold text-slate-900">एडमिन लॉगिन</h1>
                    <p class="text-xs text-slate-500">केवल पार्टी पदाधिकारियों हेतु सुरक्षित लॉगिन</p>
                </div>

                <form method="POST" action="admin.php" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">यूज़रनेम (Username)</label>
                        <input type="text" name="username" required value="admin" class="w-full border border-slate-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">पासवर्ड (Password)</label>
                        <input type="password" name="password" required value="admin123" class="w-full border border-slate-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                    </div>
                    <button type="submit" name="login" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition">
                        प्रवेश करें (Login)
                    </button>
                </form>
            </div>
        <?php else: ?>
            <!-- Admin Dashboard -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <!-- Add Press Release Form -->
                <div class="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h2 class="text-lg font-bold text-slate-900 flex items-center">
                        <i class="fa-solid fa-newspaper text-orange-600 mr-2"></i>
                        नई प्रेस विज्ञप्ति प्रकाशित करें
                    </h2>

                    <form method="POST" action="admin.php" class="space-y-3 text-sm">
                        <div>
                            <label class="block font-bold text-xs text-slate-700 mb-1">विज्ञप्ति शीर्षक (Title)</label>
                            <input type="text" name="title" required placeholder="उदा. आरक्षण समाप्त करने हेतु ज्ञापन प्रस्तुत" class="w-full border p-2.5 rounded-xl border-slate-300">
                        </div>

                        <div>
                            <label class="block font-bold text-xs text-slate-700 mb-1">श्रेणी (Category)</label>
                            <select name="category" class="w-full border p-2.5 rounded-xl border-slate-300">
                                <option value="National Agenda">राष्ट्रीय संकल्प (National Agenda)</option>
                                <option value="Press Briefing">प्रेस ब्रीफिंग (Press Briefing)</option>
                                <option value="Demonstration">प्रदर्शन व रैली (Demonstration)</option>
                                <option value="Public Announcement">सार्वजनिक घोषणा (Announcement)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block font-bold text-xs text-slate-700 mb-1">विस्तृत विवरण (Content)</label>
                            <textarea name="content" rows="4" required placeholder="प्रेस विज्ञप्ति का पूर्ण विवरण लिखें..." class="w-full border p-2.5 rounded-xl border-slate-300"></textarea>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-xs text-slate-700 mb-1">स्थान (Location)</label>
                                <input type="text" name="location" value="आगरा / नई दिल्ली" class="w-full border p-2.5 rounded-xl border-slate-300">
                            </div>
                            <div>
                                <label class="block font-bold text-xs text-slate-700 mb-1">प्रवक्ता (Spokesperson)</label>
                                <input type="text" name="spokesperson" value="कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)" class="w-full border p-2.5 rounded-xl border-slate-300">
                            </div>
                        </div>

                        <div class="flex items-center space-x-2 pt-1">
                            <input type="checkbox" name="is_urgent" id="is_urgent" value="1">
                            <label for="is_urgent" class="text-xs font-bold text-red-600">अति आवश्यक (Urgent Bulletin)</label>
                        </div>

                        <button type="submit" name="add_press_release" class="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700">
                            प्रेस विज्ञप्ति पोस्ट करें
                        </button>
                    </form>
                </div>

                <!-- Recent Members & Donations -->
                <div class="lg:col-span-6 space-y-6">
                    <!-- Recent Members -->
                    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 class="text-base font-bold text-slate-900 mb-3 flex items-center">
                            <i class="fa-solid fa-id-card text-blue-600 mr-2"></i> नवीन पार्टी कार्यकर्ता (Recent Members)
                        </h2>
                        <div class="space-y-2 text-xs">
                            <?php foreach ($members as $m): ?>
                                <div class="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-200">
                                    <div>
                                        <div class="font-bold text-slate-900"><?php echo htmlspecialchars($m['full_name']); ?> (<?php echo htmlspecialchars($m['phone']); ?>)</div>
                                        <div class="text-slate-500"><?php echo htmlspecialchars($m['precinct'] ?? 'Agra'); ?> | ID: <?php echo htmlspecialchars($m['member_card_id']); ?></div>
                                    </div>
                                    <span class="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">सक्रिय</span>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <!-- Recent Donations -->
                    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 class="text-base font-bold text-slate-900 mb-3 flex items-center">
                            <i class="fa-solid fa-hand-holding-dollar text-green-600 mr-2"></i> नवीन दान विवरण (Recent Donations)
                        </h2>
                        <div class="space-y-2 text-xs">
                            <?php foreach ($donations as $d): ?>
                                <div class="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-200">
                                    <div>
                                        <div class="font-bold text-slate-900"><?php echo htmlspecialchars($d['donor_name']); ?></div>
                                        <div class="text-slate-500">UTR: <?php echo htmlspecialchars($d['utr_number'] ?? 'N/A'); ?></div>
                                    </div>
                                    <span class="font-black text-green-700 text-sm">₹<?php echo number_format($d['amount']); ?></span>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

            </div>
        <?php endif; ?>

    </div>

</body>
</html>
