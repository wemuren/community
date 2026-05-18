<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->source_id) && !empty($data->target_id) && !empty($data->video_ids)) {
    try {
        $pdo->beginTransaction();

        $source_id = (int)$data->source_id;
        $target_id = (int)$data->target_id;
        $video_ids = $data->video_ids; // Массив [1, 2, 3...]

        // 1. Удаляем из старого плейлиста
        $placeholders = str_repeat('?,', count($video_ids) - 1) . '?';
        $del_sql = "DELETE FROM playlist_videos WHERE playlist_id = ? AND video_id IN ($placeholders)";
        $del_stmt = $pdo->prepare($del_sql);
        $del_stmt->execute(array_merge([$source_id], $video_ids));

        // 2. Добавляем в новый плейлист (используем IGNORE, чтобы не было ошибок при дубликатах)
        $ins_sql = "INSERT IGNORE INTO playlist_videos (playlist_id, video_id) VALUES (?, ?)";
        $ins_stmt = $pdo->prepare($ins_sql);
        foreach ($video_ids as $vid) {
            $ins_stmt->execute([$target_id, $vid]);
        }

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Перенесено " . count($video_ids) . " видео"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["error" => "Недостаточно данных для переноса"]);
}