<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id)) {
    try {
        $user_id = (int)$data->user_id;

        // Просто сбрасываем флаг создания канала
        $stmt = $pdo->prepare("UPDATE users SET channel_created = 0 WHERE id = ?");
        $stmt->execute([$user_id]);

        // Опционально: здесь можно также удалить видео пользователя, 
        // но обычно лучше просто скрыть канал, чтобы данные не пропали случайно.
        
        echo json_encode(["status" => "success", "message" => "Канал удален"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}