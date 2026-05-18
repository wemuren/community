<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->current_email) && !empty($data->user_id)) {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id = ?");
    $stmt->execute([$data->current_email, (int)$data->user_id]);
    
    if ($stmt->fetch()) {
        $code = (string)rand(100000, 999999);
        $pdo->prepare("DELETE FROM email_verifications WHERE email = ?")->execute([$data->current_email]);
        $pdo->prepare("INSERT INTO email_verifications (email, code) VALUES (?, ?)")->execute([$data->current_email, $code]);
        echo json_encode(["status" => "success", "code_for_test" => $code]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Это не ваш текущий email"]);
    }
}