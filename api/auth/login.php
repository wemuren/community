<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->login) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Заполните все поля"]);
    exit;
}

$login = trim($data->login);

// Ищем по email или username (регистронезависимо)
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR LOWER(username) = LOWER(?) LIMIT 1");
$stmt->execute([$login, $login]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Пользователь не найден"]);
    exit;
}

// Незавершённая регистрация — пароль ещё не задан
if (empty($user['password'])) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Регистрация не завершена. Пройдите её заново"]);
    exit;
}

if (!password_verify($data->password, $user['password'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Неверный пароль"]);
    exit;
}

// Всё ок
echo json_encode([
    "status"  => "success",
    "message" => "Вход выполнен",
    "user"    => [
        "id"              => $user['id'],
        "username"        => $user['username'],
        "email"           => $user['email'],
        "full_name"       => $user['full_name'],
        "avatar"          => $user['avatar'],
        "banner"          => $user['banner'],
        "is_paid"         => $user['is_paid'],
        "is_admin"        => $user['is_admin'],
        "is_active"       => $user['is_active'],
        "channel_created" => $user['channel_created'],
        "name_reset"      => $user['name_reset'],
        "premium_until"   => $user['premium_until'],
    ]
]);