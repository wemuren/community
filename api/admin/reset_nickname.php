<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'admin_auth.php';
$data = json_decode(file_get_contents("php://input"));
checkAdmin($pdo, $data->admin_id ?? 0);

if (!empty($data->user_id)) {
    try {
        $userId = (int)$data->user_id;
        // Формируем дефолтное имя заново
        $defaultName = "user" . $userId;
        
        // Сбрасываем и ставим флаг для уведомления
        $stmt = $pdo->prepare("UPDATE users SET full_name = ?, name_reset = 1 WHERE id = ?");
        $stmt->execute([$defaultName, $userId]);
        
        echo json_encode(["status" => "success"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}