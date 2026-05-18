<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id) && !empty($data->old_password) && !empty($data->new_password)) {
    $u_id = (int)$data->user_id;

    // 1. Проверяем старый пароль
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$u_id]);
    $user = $stmt->fetch();

    if ($user && password_verify($data->old_password, $user['password'])) {
        // 2. Хешируем новый и обновляем
        $new_hash = password_hash($data->new_password, PASSWORD_BCRYPT);
        $update = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $update->execute([$new_hash, $u_id]);
        echo json_encode(["status" => "success", "message" => "Пароль изменен"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Старый пароль неверный"]);
    }
}