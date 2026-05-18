<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php'; 

// Включаем отображение ошибок для отладки (убери в продакшене)
ini_set('display_errors', 1);
error_reporting(E_ALL);

$user_id = (int)($_GET['user_id'] ?? 0);

if ($user_id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "ID пользователя не передан"]);
    exit;
}

try {
   //
$sql = "SELECT 
            v.id, 
            v.title, 
            v.thumbnail, 
            v.views, 
            v.created_at,
            
            -- Считаем лайки (только тип 'liked')
            (SELECT COUNT(*) 
             FROM playlist_videos pv 
             JOIN playlists p ON pv.playlist_id = p.id 
             WHERE pv.video_id = v.id AND p.type = 'liked') as likes_count,
            
            -- Считаем сохранения (ИСКЛЮЧАЕМ лайки и историю)
            (SELECT COUNT(*) 
             FROM playlist_videos pv 
             JOIN playlists p ON pv.playlist_id = p.id 
             WHERE pv.video_id = v.id AND p.type NOT IN ('liked', 'history')) as saves_count
        FROM videos v
        WHERE v.user_id = ?
        ORDER BY v.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $videos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($videos as &$v) {
        $v['id'] = (int)$v['id'];
        $v['views'] = (int)$v['views'];
        $v['likes_count'] = (int)($v['likes_count'] ?? 0);
        $v['saves_count'] = (int)($v['saves_count'] ?? 0);
    }

    echo json_encode($videos);

} catch (Exception $e) {
    http_response_code(500);
    // Выводим точную ошибку, чтобы понять, на какой таблице споткнулся SQL
    echo json_encode(["error" => $e->getMessage()]);
}