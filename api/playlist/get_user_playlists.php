<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

$user_id = (int)$_GET['user_id'];
$viewer_id = isset($_GET['viewer_id']) ? (int)$_GET['viewer_id'] : 0;

try {
    // 1. ПОЛУЧАЕМ СОБСТВЕННЫЕ ПЛЕЙЛИСТЫ (твоя старая логика)
    $privacy_filter = ($user_id === $viewer_id) ? "" : " AND p.is_private = 0";

    $sql_my = "SELECT p.*, 
            (SELECT v.thumbnail FROM videos v 
             JOIN playlist_videos pv ON v.id = pv.video_id 
             WHERE pv.playlist_id = p.id 
             ORDER BY pv.added_at DESC LIMIT 1) as last_video_thumbnail,
            (SELECT COUNT(*) FROM playlist_videos WHERE playlist_id = p.id) as video_count
            FROM playlists p 
            WHERE p.user_id = ? $privacy_filter
            ORDER BY 
                CASE 
                    WHEN p.type = 'liked' THEN 1 
                    WHEN p.type = 'history' THEN 2 
                    WHEN p.type = 'watch_later' THEN 3 
                    ELSE 4 
                END ASC, 
                p.id DESC";

    $stmt_my = $pdo->prepare($sql_my);
    $stmt_my->execute([$user_id]);
    $my_playlists = $stmt_my->fetchAll(PDO::FETCH_ASSOC);

    // 2. ПОЛУЧАЕМ СОХРАНЕННЫЕ ЧУЖИЕ ПЛЕЙЛИСТЫ
    // Мы ищем записи в playlist_saves, где user_id = наш ID
    $sql_saved = "SELECT p.*, 
            u.username as author_name,
            (SELECT v.thumbnail FROM videos v 
             JOIN playlist_videos pv ON v.id = pv.video_id 
             WHERE pv.playlist_id = p.id 
             ORDER BY pv.added_at DESC LIMIT 1) as last_video_thumbnail,
            (SELECT COUNT(*) FROM playlist_videos WHERE playlist_id = p.id) as video_count,
            1 as is_saved -- Флаг для фронтенда
            FROM playlists p
            JOIN playlist_saves ps ON p.id = ps.playlist_id
            JOIN users u ON p.user_id = u.id
            WHERE ps.user_id = ? AND p.user_id != ? -- Не берем свои в этот список
            ORDER BY ps.created_at DESC";

    $stmt_saved = $pdo->prepare($sql_saved);
    $stmt_saved->execute([$user_id, $user_id]);
    $saved_playlists = $stmt_saved->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success", 
        "playlists" => $my_playlists,
        "saved_playlists" => $saved_playlists
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}