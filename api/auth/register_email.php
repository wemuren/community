<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';
require_once '../mailer.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email)) {
    $email = trim($data->email);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Некорректный email"]);
        exit;
    }

    try {
        $checkStmt = $pdo->prepare("SELECT id, password FROM users WHERE email = ?");
        $checkStmt->execute([$email]);
        $user = $checkStmt->fetch();

        if ($user) {
            if (!empty($user['password'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Этот email уже зарегистрирован"]);
                exit;
            }
        } else {
            $random_username = 'user_' . bin2hex(random_bytes(3));
            $pdo->prepare("INSERT INTO users (username, email) VALUES (?, ?)")
                ->execute([$random_username, $email]);
        }

        $code = (string)rand(100000, 999999);
        $pdo->prepare("DELETE FROM email_verifications WHERE email = ?")->execute([$email]);
        $pdo->prepare("INSERT INTO email_verifications (email, code) VALUES (?, ?)")->execute([$email, $code]);

        if (!sendVerificationCode($email, $code)) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Не удалось отправить письмо, попробуйте позже"]);
            exit;
        }

        echo json_encode(["status" => "success", "message" => "Код отправлен на почту"]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Ошибка сервера, попробуйте позднее"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Введите email"]);
}