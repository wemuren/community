<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->login) && !empty($data->password)) {
    $sql = "SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$data->login, $data->login]);
    $user = $stmt->fetch();

    if ($user && password_verify($data->password, $user['password'])) {
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
                "subscribers"     => $user['subscribers'],
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Неверный логин или пароль"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Заполните все поля"]);
}
?>