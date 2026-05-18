<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->video_id) && !empty($data->user_id)) {
    try {
        // Проверяем, что видео реально принадлежит этому юзеру (защита от взлома)
        $stmt = $pdo->prepare("DELETE FROM videos WHERE id = ? AND user_id = ?");
        $stmt->execute([$data->video_id, $data->user_id]);
        
        echo json_encode(["status" => "success"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}