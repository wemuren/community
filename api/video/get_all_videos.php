<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$current_user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$tagFilter = $_GET['tag'] ?? null;

try {
    $sql = "SELECT v.*, u.username, u.full_name, u.avatar, u.is_paid,
            (SELECT GROUP_CONCAT(t.name) 
             FROM video_tags vt 
             JOIN tags t ON vt.tag_id = t.id 
             WHERE vt.video_id = v.id) as tags_list,
            (SELECT COUNT(*) 
             FROM playlist_videos pv 
             JOIN playlists p ON pv.playlist_id = p.id 
             WHERE pv.video_id = v.id AND p.user_id = :current_user_1 AND p.type = 'liked') as is_liked,
            (SELECT COUNT(*) 
             FROM playlist_videos pv 
             JOIN playlists p ON pv.playlist_id = p.id 
             WHERE pv.video_id = v.id AND p.user_id = :current_user_2 AND p.type = 'watch_later') as in_later
            FROM videos v
            JOIN users u ON v.user_id = u.id
            WHERE u.is_active = 1"; // Строго скрываем ролики забаненных авторов

    if ($tagFilter) {
        $sql .= " AND v.id IN (
            SELECT vt.video_id 
            FROM video_tags vt 
            JOIN tags t ON vt.tag_id = t.id 
            WHERE t.name = :tag_name
        )";
    }

    $sql .= " ORDER BY v.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':current_user_1', $current_user_id, PDO::PARAM_INT);
    $stmt->bindParam(':current_user_2', $current_user_id, PDO::PARAM_INT);
    
    if ($tagFilter) {
        $stmt->bindParam(':tag_name', $tagFilter);
    }

    $stmt->execute();
    $videos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ИСПРАВЛЕНО: Отдаем структурированный ответ в едином стиле платформы
    echo json_encode([
        "status" => "success",
        "videos" => $videos
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "error" => $e->getMessage()]);
}