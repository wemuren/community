<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->playlist_id) && !empty($data->video_ids)) {
    try {
        $playlist_id = (int)$data->playlist_id;
        $video_ids = $data->video_ids;

        $placeholders = str_repeat('?,', count($video_ids) - 1) . '?';
        $sql = "DELETE FROM playlist_videos WHERE playlist_id = ? AND video_id IN ($placeholders)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_merge([$playlist_id], $video_ids));

        echo json_encode(["status" => "success"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}