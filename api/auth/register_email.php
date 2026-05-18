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

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email)) {
    $email = trim($data->email);

    // 1. Проверка на корректность формата email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Некорректный email"]);
        exit;
    }

    try {
        // 2. Проверяем статус пользователя
        $checkStmt = $pdo->prepare("SELECT id, password FROM users WHERE email = ?");
        $checkStmt->execute([$email]);
        $user = $checkStmt->fetch();

        if ($user) {
            // Если пароль уже есть — значит аккаунт полноценный
            if (!empty($user['password'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Этот email уже зарегистрирован"]);
                exit;
            }
            // Если пароля нет — просто используем существующий ID (зависшая регистрация)
            $user_id = $user['id'];
        } else {
            // Создаем «черновик» пользователя
            $random_username = 'user_' . bin2hex(random_bytes(3));
            $insUser = $pdo->prepare("INSERT INTO users (username, email) VALUES (?, ?)");
            $insUser->execute([$random_username, $email]);
            $user_id = $pdo->lastInsertId();
        }

        // 3. Работа с кодом подтверждения
        $code = (string)rand(100000, 999999);
        
        // Удаляем старые коды для этой почты, чтобы не мусорить
        $pdo->prepare("DELETE FROM email_verifications WHERE email = ?")->execute([$email]);
        
        $sql_code = "INSERT INTO email_verifications (email, code) VALUES (?, ?)";
        $stmt_code = $pdo->prepare($sql_code);
        $stmt_code->execute([$email, $code]);

        // 4. Успешный ответ
        echo json_encode([
            "status" => "success",
            "message" => "Код отправлен на почту",
            "code_for_test" => $code // Оставляем для тестов в XAMPP
        ]);

    } catch (Exception $e) {
        // Ошибка сервера (например, база упала)
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Ошибка сервера, попробуйте позднее"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Введите email"]);
}