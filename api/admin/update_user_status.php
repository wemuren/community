<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'admin_auth.php';

$data = json_decode(file_get_contents("php://input"));

// Проверяем админа
checkAdmin($pdo, $data->admin_id ?? 0);

if (!empty($data->user_id)) {
    try {
        $stmt = $pdo->prepare("UPDATE users SET is_active = ? WHERE id = ?");
        $stmt->execute([
            (int)$data->is_active, 
            (int)$data->user_id
        ]);
        
        echo json_encode(["status" => "success", "message" => "Статус обновлен"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}