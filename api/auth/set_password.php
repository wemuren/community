<?php
// 1. Разрешаем запросы с любого домена (для разработки это ок)
header("Access-Control-Allow-Origin: *");

// 2. Разрешаем любые заголовки (Content-Type, Authorization и т.д.)
header("Access-Control-Allow-Headers: *");

// 3. Разрешаем методы (POST, GET, OPTIONS и т.д.)
header("Access-Control-Allow-Methods: *");

// 4. ОЧЕНЬ ВАЖНО: обрабатываем тот самый "разведывательный" запрос OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Если это OPTIONS, просто говорим "ок" и завершаем скрипт
    http_response_code(200);
    exit;
}
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email) && !empty($data->password)){
    // Хэшируем пароль
    $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
    
    // Обновляем пользователя
    $sql = "UPDATE users SET password = ?, is_active = 1 WHERE email = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$hashed_password, $data->email]);

    echo json_encode(["message" => "Регистрация завершена, можете войти", "status" => "success"]);
}
?>