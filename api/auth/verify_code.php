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

if(!empty($data->email) && !empty($data->code)){
    // Ищем e-mail и код в базе
    $sql = "SELECT * FROM email_verifications WHERE email = ? AND code = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$data->email, $data->code]);
    $verification = $stmt->fetch();

    if ($verification) {
        // Код верный! Удаляем его, чтобы не использовали дважды
        $sql_del = "DELETE FROM email_verifications WHERE email = ?";
        $pdo->prepare($sql_del)->execute([$data->email]);
        
        echo json_encode(["message" => "Код верный, задайте пароль", "status" => "success"]);
    } else {
        echo json_encode(["message" => "Неверный код", "status" => "error"]);
    }
}
?>