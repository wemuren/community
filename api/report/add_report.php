<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->reporter_id) && !empty($data->target_id) && !empty($data->target_type)) {
    try {
        $stmt = $pdo->prepare("INSERT INTO reports (reporter_id, target_id, target_type, reason) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            (int)$data->reporter_id,
            (int)$data->target_id,
            $data->target_type,
            $data->reason ?? 'Без описания'
        ]);
        echo json_encode(["status" => "success", "message" => "Жалоба отправлена"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Ошибка при отправке"]);
    }
}