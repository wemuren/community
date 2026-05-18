<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../db.php';
$data = json_decode(file_get_contents("php://input"));

$email = isset($data->email) ? strtolower(trim($data->email)) : '';
$code = isset($data->code) ? trim($data->code) : '';

if (empty($email) || empty($code)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Данные не полные"]);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM email_verifications WHERE LOWER(email) = ? AND code = ?");
$stmt->execute([$email, $code]);

if ($stmt->fetch()) {
    echo json_encode(["status" => "success"]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Код не найден для адреса $email"]);
}
?>