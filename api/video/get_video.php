<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$viewer_id = isset($_GET['viewer_id']) ? (int)$_GET['viewer_id'] : 0;

if ($id > 0) {
    try {
        $sql = "SELECT 
                v.*, 
                u.username, u.full_name, u.avatar, u.is_paid as user_is_paid,
                
                -- Считаем только лайки
                (SELECT COUNT(*) FROM playlist_videos pv 
                 JOIN playlists p ON pv.playlist_id = p.id 
                 WHERE pv.video_id = v.id AND p.type = 'liked') as likes_count,
                
                -- Считаем сохранения, ИСКЛЮЧАЯ лайки и историю просмотров
                (SELECT COUNT(*) FROM playlist_videos pv 
                 JOIN playlists p ON pv.playlist_id = p.id 
                 WHERE pv.video_id = v.id AND p.type NOT IN ('liked', 'history')) as saves_count,
                
                -- Проверка: лайкнул ли это видео текущий зритель
                (SELECT COUNT(*) FROM playlist_videos pv 
                 JOIN playlists p ON pv.playlist_id = p.id 
                 WHERE pv.video_id = v.id AND p.type = 'liked' AND p.user_id = ?) as is_liked
                 
            FROM videos v 
            JOIN users u ON v.user_id = u.id 
            WHERE v.id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$viewer_id, $id]);
        $video = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($video) {
            // Загрузка тегов для видео
            $t_stmt = $pdo->prepare("SELECT t.name FROM tags t JOIN video_tags vt ON t.id = vt.tag_id WHERE vt.video_id = ?");
            $t_stmt->execute([$id]);
            $video['tags'] = $t_stmt->fetchAll(PDO::FETCH_COLUMN);

            echo json_encode(["status" => "success", "video" => $video]);
        } else {
            echo json_encode(["status" => "error", "message" => "Видео не найдено"]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        // Исправлено: использование -> для доступа к методу объекта
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}