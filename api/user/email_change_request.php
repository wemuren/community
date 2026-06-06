<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../db.php';
require_once '../mailer.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->current_email) && !empty($data->user_id)) {
    $current_email = strtolower(trim($data->current_email));
    $user_id = (int)$data->user_id;

    $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ? AND id = ?");
    $stmt->execute([$current_email, $user_id]);

    if ($stmt->fetch()) {
        $code = (string)rand(100000, 999999);
        $pdo->prepare("DELETE FROM email_verifications WHERE LOWER(email) = ?")->execute([$current_email]);
        $pdo->prepare("INSERT INTO email_verifications (email, code) VALUES (?, ?)")->execute([$current_email, $code]);

        if (!sendVerificationCode($current_email, $code)) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Не удалось отправить письмо, попробуйте позже"]);
            exit;
        }

        echo json_encode(["success" => true]);
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Введенный адрес не совпадает с вашим текущим email"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Данные не полные"]);
}