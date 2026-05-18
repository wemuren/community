<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->user_id) || !isset($data->code)) {
    echo json_encode(["status" => "error", "message" => "Недостаточно данных"]);
    exit;
}

$uid  = (int)$data->user_id;
$code = trim($data->code);

try {
    // 1. Находим промокод
    $stmt = $pdo->prepare("SELECT id, type, duration_days, is_used FROM promo_codes WHERE code = ? LIMIT 1");
    $stmt->execute([$code]);
    $promo = $stmt->fetch();

    if (!$promo) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Код не существует"]);
        exit;
    }

    $days    = (int)$promo['duration_days'];
    $promoId = (int)$promo['id'];
    $type    = $promo['type'];

    if ($type === 'unique') {
        // Уникальный код — можно использовать только один раз вообще
        if ($promo['is_used']) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Этот код уже был активирован"]);
            exit;
        }
    } else {
        // Shared код — проверяем, не использовал ли этот конкретный юзер
        $check = $pdo->prepare("SELECT id FROM promo_usages WHERE promo_id = ? AND user_id = ?");
        $check->execute([$promoId, $uid]);
        if ($check->fetch()) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Вы уже активировали этот код"]);
            exit;
        }
    }

    $pdo->beginTransaction();

    // 2. Начисляем дни пользователю
    $updUser = $pdo->prepare("
        UPDATE users 
        SET is_paid = 1, 
            premium_until = DATE_ADD(
                GREATEST(IFNULL(premium_until, NOW()), NOW()), 
                INTERVAL ? DAY
            ) 
        WHERE id = ?
    ");
    $updUser->execute([$days, $uid]);

    if ($type === 'unique') {
        // Сжигаем уникальный код
        $pdo->prepare("UPDATE promo_codes SET is_used = 1, used_by = ? WHERE id = ?")
            ->execute([$uid, $promoId]);
    } else {
        // Записываем использование shared кода этим юзером
        $pdo->prepare("INSERT INTO promo_usages (promo_id, user_id) VALUES (?, ?)")
            ->execute([$promoId, $uid]);
    }

    $pdo->commit();

    echo json_encode([
        "status"  => "success",
        "message" => "Активировано! Добавлено дней: $days"
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Ошибка сервера: " . $e->getMessage()]);
}
?>