<?php
// Разрешаем запросы с фронтенда
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php'; 

// Получаем данные
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id)) {
    try {
        // 1. Обновляем статус создания канала
        $stmt = $pdo->prepare("UPDATE users SET channel_created = 1 WHERE id = ?");
        $stmt->execute([(int)$data->user_id]);
        
        // 2. Вытягиваем обновленного юзера, чтобы вернуть его во фронтенд
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([(int)$data->user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo json_encode(["status" => "success", "user" => $user]);
        } else {
            echo json_encode(["status" => "error", "message" => "Пользователь не найден"]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Ошибка базы: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Не передан user_id"]);
}