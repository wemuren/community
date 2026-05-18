<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once '../db.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->video_id) && !empty($data->user_id)) {
    $vid = (int)$data->video_id;
    $uid = (int)$data->user_id;

    try {
        $pdo->beginTransaction();

        // Берем или создаем плейлист истории
        $stmt = $pdo->prepare("SELECT id FROM playlists WHERE user_id = ? AND type = 'history' LIMIT 1");
        $stmt->execute([$uid]);
        $playlist_id = $stmt->fetchColumn();

        if (!$playlist_id) {
            $pdo->prepare("INSERT INTO playlists (user_id, title, type, is_private) VALUES (?, 'История просмотров', 'history', 1)")
                ->execute([$uid]);
            $playlist_id = $pdo->lastInsertId();
        }

        // Добавляем видео (если оно уже есть в истории — просто обновляем время просмотра)
        // Это заставит видео переместиться в начало списка
        $sql = "INSERT INTO playlist_videos (playlist_id, video_id, added_at) 
                VALUES (?, ?, NOW()) 
                ON DUPLICATE KEY UPDATE added_at = NOW()";
        $pdo->prepare($sql)->execute([$playlist_id, $vid]);

        // Очистка: оставляем только последние 20 видео в истории этого юзера
        $cleanSql = "DELETE FROM playlist_videos 
                     WHERE playlist_id = ? 
                     AND id NOT IN (
                         SELECT id FROM (
                             SELECT id FROM playlist_videos 
                             WHERE playlist_id = ? 
                             ORDER BY added_at ASC LIMIT 20
                         ) as tmp
                     )";
        $pdo->prepare($cleanSql)->execute([$playlist_id, $playlist_id]);

        $pdo->commit();
        echo json_encode(["status" => "success"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["error" => $e->getMessage()]);
    }
}