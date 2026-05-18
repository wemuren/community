<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        // Обнуляем флаг сброса имени в базе данных
        $stmt = $pdo->prepare("UPDATE users SET name_reset = 0 WHERE id = ?");
        $stmt->execute([$data->id]);
        echo json_encode(["status" => "success"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No ID provided"]);
}