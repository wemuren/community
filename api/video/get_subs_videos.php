<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
// ИСПРАВЛЕНО: Добавлен GET в список разрешенных методов, чтобы CORS не ругался при чтении параметров
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

// Проверяем, передан ли ID авторизованного пользователя
if (!isset($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing user_id parameter"]);
    exit;
}

$user_id = (int)$_GET['user_id'];

try {
    // Магия SQL: вытаскиваем видео авторов, на которых подписан юзер,
    // а также подтягиваем теги ролика, статус лайка и сохранения в "Позже" для этого юзера.
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
            JOIN subscriptions s ON v.user_id = s.followed_id
            WHERE s.follower_id = :follower_id AND u.is_active = 1
            ORDER BY v.created_at DESC";
            
    $stmt = $pdo->prepare($sql);
    
    // Привязываем переменные через именованные плейсхолдеры
    $stmt->bindParam(':follower_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':current_user_1', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':current_user_2', $user_id, PDO::PARAM_INT);
    
    $stmt->execute();
    
    // Возвращаем ассоциативный массив (без дублирования индексов)
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}