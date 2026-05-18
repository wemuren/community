<?php
// api/playlist/add_to_playlist.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->playlist_id) && !empty($data->video_id)) {
    $p_id = (int)$data->playlist_id;
    $v_id = (int)$data->video_id;

    try {
        // Проверяем, нет ли его там уже, чтобы не триггерить UNIQUE constraint
        $check = $pdo->prepare("SELECT id FROM playlist_videos WHERE playlist_id = ? AND video_id = ?");
        $check->execute([$p_id, $v_id]);
        
        if ($check->fetch()) {
            echo json_encode(["status" => "exists", "message" => "Видео уже в этом плейлисте"]);
            exit;
        }

        $add = $pdo->prepare("INSERT INTO playlist_videos (playlist_id, video_id) VALUES (?, ?)");
        $add->execute([$p_id, $v_id]);
        echo json_encode(["status" => "success"]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Ошибка базы данных"]);
    }
}