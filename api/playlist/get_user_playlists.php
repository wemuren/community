<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

$user_id = (int)$_GET['user_id'];
$viewer_id = isset($_GET['viewer_id']) ? (int)$_GET['viewer_id'] : 0;

try {
    // 1. ПОЛУЧАЕМ СОБСТВЕННЫЕ ПЛЕЙЛИСТЫ КАНАЛА
    $privacy_filter = ($user_id === $viewer_id) ? "" : " AND p.is_private = 0";

    // ИСПРАВЛЕНО: Добавлен подзапрос, который проверяет, лайкнул ли viewer_id этот плейлист
    $sql_my = "SELECT p.*, 
            (SELECT v.thumbnail FROM videos v 
             JOIN playlist_videos pv ON v.id = pv.video_id 
             WHERE pv.playlist_id = p.id 
             ORDER BY pv.added_at DESC LIMIT 1) as last_video_thumbnail,
            (SELECT COUNT(*) FROM playlist_videos WHERE playlist_id = p.id) as video_count,
            (SELECT COUNT(*) FROM playlist_saves WHERE playlist_id = p.id AND user_id = :viewer_id_1) as is_saved
            FROM playlists p 
            WHERE p.user_id = :user_id $privacy_filter
            ORDER BY 
                CASE 
                    WHEN p.type = 'liked' THEN 1 
                    WHEN p.type = 'history' THEN 2 
                    WHEN p.type = 'watch_later' THEN 3 
                    ELSE 4 
                END ASC, 
                p.id DESC";

    $stmt_my = $pdo->prepare($sql_my);
    $stmt_my->bindParam(':viewer_id_1', $viewer_id, PDO::PARAM_INT);
    $stmt_my->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt_my->execute();
    $my_playlists = $stmt_my->fetchAll(PDO::FETCH_ASSOC);

    // 2. ПОЛУЧАЕМ СОХРАНЕННЫЕ ЧУЖИЕ ПЛЕЙЛИСТЫ (КОЛЛЕКЦИИ)
    // Здесь мы жестко возвращаем 1, так как эти записи вытаскиваются напрямую из таблицы сохранений текущего юзера
    $sql_saved = "SELECT p.*, 
            u.username as author_name,
            (SELECT v.thumbnail FROM videos v 
             JOIN playlist_videos pv ON v.id = pv.video_id 
             WHERE pv.playlist_id = p.id 
             ORDER BY pv.added_at DESC LIMIT 1) as last_video_thumbnail,
            (SELECT COUNT(*) FROM playlist_videos WHERE playlist_id = p.id) as video_count,
            1 as is_saved 
            FROM playlists p
            JOIN playlist_saves ps ON p.id = ps.playlist_id
            JOIN users u ON p.user_id = u.id
            WHERE ps.user_id = :viewer_id_2 AND p.user_id != :user_id_check
            ORDER BY ps.created_at DESC";

    $stmt_saved = $pdo->prepare($sql_saved);
    $stmt_saved->bindParam(':viewer_id_2', $user_id, PDO::PARAM_INT);
    $stmt_saved->bindParam(':user_id_check', $user_id, PDO::PARAM_INT);
    $stmt_saved->execute();
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