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
    $isPaid = (int)$data->is_paid;

    // Обновляем и статус, и дату окончания
    // Если $isPaid == 1, ставим NOW + 30 дней. Если 0 — ставим NULL.
    $sql = "UPDATE users 
            SET is_paid = ?, 
                premium_until = IF(? = 1, DATE_ADD(NOW(), INTERVAL 30 DAY), NULL) 
            WHERE id = ?";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$isPaid, $isPaid, $userId]);

    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
}