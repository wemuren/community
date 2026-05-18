<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($user_id <= 0) {
    echo json_encode(["status" => "error", "message" => "ID пользователя не передан"]);
    exit;
}

try {
    // 1. Просмотры и общее кол-во видео
    $v_stmt = $pdo->prepare("SELECT SUM(views) as total_views, COUNT(id) as total_videos FROM videos WHERE user_id = ?");
    $v_stmt->execute([$user_id]);
    $video_base = $v_stmt->fetch();

    // 2. Лайки (считаем вхождения твоих видео в плейлисты типа 'liked')
    $l_stmt = $pdo->prepare("
        SELECT COUNT(pv.id) 
        FROM playlist_videos pv
        JOIN playlists p ON pv.playlist_id = p.id
        JOIN videos v ON pv.video_id = v.id
        WHERE v.user_id = ? AND p.type = 'liked'
    ");
    $l_stmt->execute([$user_id]);
    $total_likes = (int)$l_stmt->fetchColumn();

    // 3. Сохранения (считаем вхождения твоих видео во ВСЕ плейлисты, кроме 'liked')
    $s_stmt = $pdo->prepare("
        SELECT COUNT(pv.id) 
        FROM playlist_videos pv
        JOIN playlists p ON pv.playlist_id = p.id
        JOIN videos v ON pv.video_id = v.id
        WHERE v.user_id = ? AND p.type != 'liked'
    ");
    $s_stmt->execute([$user_id]);
    $total_saves = (int)$s_stmt->fetchColumn();

    // 4. Комментарии (под всеми твоими видео)
    $c_stmt = $pdo->prepare("
        SELECT COUNT(c.id) 
        FROM comments c 
        JOIN videos v ON c.video_id = v.id 
        WHERE v.user_id = ?
    ");
    $c_stmt->execute([$user_id]);
    $total_comments = (int)$c_stmt->fetchColumn();

    // 5. Подписчики
    $sub_stmt = $pdo->prepare("SELECT COUNT(*) FROM subscriptions WHERE followed_id = ?");
    $sub_stmt->execute([$user_id]);
    $total_subs = (int)$sub_stmt->fetchColumn();

    // 6. Самое популярное видео
   $top_vid_stmt = $pdo->prepare("
        SELECT v.id, v.title, v.views, v.thumbnail, v.created_at, u.username, u.full_name 
        FROM videos v 
        JOIN users u ON v.user_id = u.id
        WHERE v.user_id = ? 
        ORDER BY views DESC LIMIT 1
    ");
    $top_vid_stmt->execute([$user_id]);
    $top_video = $top_vid_stmt->fetch(PDO::FETCH_ASSOC);

    // 7. ПОСЛЕДНИЕ КОММЕНТАРИИ (к любым видео автора)
    $comm_list_stmt = $pdo->prepare("
        SELECT 
            c.text, 
            c.created_at, 
            v.title as video_title, 
            v.id as video_id,
            u.username, 
            u.avatar 
        FROM comments c
        JOIN videos v ON c.video_id = v.id
        JOIN users u ON c.user_id = u.id
        WHERE v.user_id = ?
        ORDER BY c.created_at DESC 
        LIMIT 5
    ");
    $comm_list_stmt->execute([$user_id]);
    $recent_comments = $comm_list_stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "stats" => [
            "total_views" => (int)($video_base['total_views'] ?? 0),
            "total_likes" => $total_likes,
            "total_saves" => $total_saves,
            "total_comments" => $total_comments,
            "total_subscribers" => $total_subs,
            "top_video" => $top_video,
            "recent_comments" => $recent_comments // ПЕРЕДАЕМ КОММЕНТЫ
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}