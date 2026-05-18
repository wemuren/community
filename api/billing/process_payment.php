<?php
// 1. Стандартные заголовки
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");

// 2. МАГИЯ ДЛЯ OPTIONS (Preflight)
// Если браузер спрашивает "можно ли?", мы отвечаем "да" и прекращаем выполнение скрипта
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->user_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Некорректные данные"]);
    exit;
}

$uid = (int)$data->user_id;

try {
    /* ЛОГИКА ПРОДЛЕНИЯ (SQL):
       1. IFNULL(premium_until, NOW()) — если даты нет, берем текущее время.
       2. GREATEST(..., NOW()) — если старая дата уже прошла, берем текущее время. 
          Если она еще в будущем — берем её.
       3. DATE_ADD(..., INTERVAL 30 DAY) — прибавляем ровно 30 дней к результату.
    */
    $sql = "UPDATE users 
            SET is_paid = 1, 
                premium_until = DATE_ADD(GREATEST(IFNULL(premium_until, NOW()), NOW()), INTERVAL 30 DAY) 
            WHERE id = ?";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$uid]);

    // Получим новую дату, чтобы вернуть её фронтенду (опционально, но полезно)
    $check = $pdo->prepare("SELECT premium_until FROM users WHERE id = ?");
    $check->execute([$uid]);
    $new_date = $check->fetchColumn();

    echo json_encode([
        "status" => "success",
        "new_expiry" => $new_date
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => $e->getMessage()
    ]);
}