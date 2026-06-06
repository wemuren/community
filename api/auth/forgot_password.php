<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../db.php';
require_once '../mailer.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email)) {
    $email = trim($data->email);

    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND password IS NOT NULL");
        $stmt->execute([$email]);

        if (!$stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Пользователь с таким email не найден"]);
            exit;
        }

        $code = (string)rand(100000, 999999);
        $pdo->prepare("DELETE FROM email_verifications WHERE email = ?")->execute([$email]);
        $pdo->prepare("INSERT INTO email_verifications (email, code) VALUES (?, ?)")->execute([$email, $code]);

        if (!sendVerificationCode($email, $code)) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Не удалось отправить письмо, попробуйте позже"]);
            exit;
        }

        echo json_encode(["status" => "success", "message" => "Код отправлен"]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Ошибка сервера, попробуйте позже"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Введите email"]);
}