<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
require_once 'admin_auth.php';

$admin_id = $_GET['admin_id'] ?? 0;
checkAdmin($pdo, $admin_id);

try {
   // 1. Основные счетчики
    $total_users = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $premium_users = $pdo->query("SELECT COUNT(*) FROM users WHERE is_paid = 1")->fetchColumn();
    $total_videos = $pdo->query("SELECT COUNT(*) FROM videos")->fetchColumn();
    $total_tags = $pdo->query("SELECT COUNT(*) FROM tags")->fetchColumn();
    
    // Всего объектов с жалобами (уникальные пары id + type)
    $total_reports = $pdo->query("SELECT COUNT(DISTINCT target_id, target_type) FROM reports")->fetchColumn() ?: 0;
    
    // Критические жалобы (10+)
    $urgent_reports = $pdo->query("SELECT COUNT(*) FROM (SELECT target_id FROM reports GROUP BY target_id, target_type HAVING COUNT(*) >= 10) as urgent")->fetchColumn() ?: 0;

    // 2. Сводка за сегодня
    $new_users_today = $pdo->query("SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()")->fetchColumn();
    $new_videos_today = $pdo->query("SELECT COUNT(*) FROM videos WHERE DATE(created_at) = CURDATE()")->fetchColumn();
    
    // 3. Финансы
    $price = (int)($pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'sub_price'")->fetchColumn() ?: 900);
    $monthly_earnings = $premium_users * $price;

    // 4. ТОП-3 ТЕГА ПО ПРОСМОТРАМ
    $top_tags_views = $pdo->query("
        SELECT t.name, SUM(v.views) as total_views
        FROM tags t
        JOIN video_tags vt ON t.id = vt.tag_id
        JOIN videos v ON vt.video_id = v.id
        GROUP BY t.id ORDER BY total_views DESC LIMIT 3
    ")->fetchAll(PDO::FETCH_ASSOC);

    // 5. ТОП-3 ТЕГА ПО ПУБЛИКАЦИЯМ
    $top_tags_count = $pdo->query("
        SELECT t.name, COUNT(vt.video_id) as video_count
        FROM tags t
        JOIN video_tags vt ON t.id = vt.tag_id
        GROUP BY t.id ORDER BY video_count DESC LIMIT 3
    ")->fetchAll(PDO::FETCH_ASSOC);

    // ... внутри get_stats.php
    $top_user_today = $pdo->query("
    SELECT 
        u.id,
        u.username,
        COALESCE(u.full_name, u.username) as display_name, 
        u.avatar,
        u.is_paid,
        COUNT(*) as today_views
    FROM users u
    JOIN videos v ON u.id = v.user_id
    JOIN video_views_log vl ON v.id = vl.video_id
    WHERE vl.viewed_at >= CURDATE() AND vl.viewed_at < CURDATE() + INTERVAL 1 DAY
    GROUP BY u.id, u.username, u.full_name, u.avatar, u.is_paid
    ORDER BY today_views DESC 
    LIMIT 1
")->fetch(PDO::FETCH_ASSOC) ?: null;

// ТОП ТЕГОВ СЕГОДНЯ
$top_tags_today = $pdo->query("
    SELECT t.name, COUNT(*) as views_today
    FROM tags t
    JOIN video_tags vt ON t.id = vt.tag_id
    JOIN video_views_log vl ON vt.video_id = vl.video_id
    WHERE DATE(vl.viewed_at) = CURDATE()
    GROUP BY t.id, t.name 
    ORDER BY views_today DESC 
    LIMIT 3
")->fetchAll(PDO::FETCH_ASSOC);


   echo json_encode([
        "total_users" => (int)$total_users,
        "premium_users" => (int)$premium_users,
        "total_videos" => (int)$total_videos,
        "total_tags" => (int)$total_tags,
        "total_reports" => (int)$total_reports,
        "urgent_reports" => (int)$urgent_reports,
        "new_users_today" => (int)$new_users_today,
        "new_videos_today" => (int)$new_videos_today,
        "monthly_earnings" => (int)$monthly_earnings,
        "current_price" => $price,
        "top_tags_views" => $top_tags_views,
        "top_tags_count" => $top_tags_count,
        "top_user_today" => $top_user_today,
        "top_tags_today" => $top_tags_today // ДОБАВИЛИ ЭТУ СТРОЧКУ
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}