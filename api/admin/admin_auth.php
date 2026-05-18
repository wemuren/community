<?php
// 1. Настройка CORS для Vite
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");

// Обработка предварительного запроса браузера
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php'; 

/**
 * Функция проверки прав админа. 
 * Если не админ — скрипт сразу убивается с ошибкой 403.
 */
function checkAdmin($pdo, $user_id) {
    if (!$user_id || $user_id == 0) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
    $stmt->execute([(int)$user_id]);
    $user = $stmt->fetch();
    
    if (!$user || (int)$user['is_admin'] !== 1) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Доступ запрещен: вы не админ"]);
        exit;
    }
}