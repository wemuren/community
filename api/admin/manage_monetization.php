<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Обработка CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'admin_auth.php'; // Твоя родная авторизация админа
$method = $_SERVER['REQUEST_METHOD'];

// Универсальная функция для генерации случайного хвоста промокода
function generateRandomSuffix($length = 6) {
    $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $result = '';
    for ($i = 0; $i < $length; $i++) {
        $result .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $result;
}

if ($method === 'GET') {
    checkAdmin($pdo, $_GET['admin_id'] ?? 0);
    
    // Получаем цену из настроек (твоя структура)
    $price = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'sub_price'")->fetchColumn() ?: '900';
    
    // Получаем активные промокоды
    $promos = $pdo->query("SELECT id, code, created_at FROM promo_codes WHERE is_used = 0 ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
    
    // Получаем реестр премиум-клиентов
    $premiums = $pdo->query("SELECT id, full_name, username, avatar, is_paid, premium_until FROM users WHERE is_paid = 1 AND premium_until > NOW()")->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["promos" => $promos, "premiums" => $premiums, "price" => $price]);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    checkAdmin($pdo, $data->admin_id ?? 0);

    // 1. ИЗМЕНЕНИЕ ЦЕНЫ ПОДПИСКИ
    if ($data->action === 'update_price') {
        $stmt = $pdo->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES ('sub_price', ?)");
        $stmt->execute([$data->new_price]);
        echo json_encode(["status" => "success"]);
        exit;
    }
    
    // 2. ГЕНЕРАЦИЯ ПРОМОКОДА (ГИБРИДНАЯ: РУЧНАЯ + РАНДОМ)
    if ($data->action === 'generate_promo') {
        $code = isset($data->custom_code) ? trim($data->custom_code) : '';

        // Если с фронта прилетел пустой инпут (только префикс), генерируем рандомный хвост
        if (empty($code) || $code === 'COMM-') {
            $code = "COMM-" . generateRandomSuffix(8);
        }

        // Страховка от дубликатов кодов в базе данных
        $check = $pdo->prepare("SELECT id FROM promo_codes WHERE code = ?");
        $check->execute([$code]);
        if ($check->fetch()) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Такой промокод уже существует"]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO promo_codes (code) VALUES (?)");
        $stmt->execute([$code]);
        echo json_encode(["status" => "success", "message" => "Промокод успешно создан"]);
        exit;
    }

    // 3. УДАЛЕНИЕ ПРОМОКОДА (ДОБАВЛЕНО)
    if ($data->action === 'delete_promo') {
        $promo_id = isset($data->promo_id) ? intval($data->promo_id) : 0;

        $stmt = $pdo->prepare("DELETE FROM promo_codes WHERE id = ?");
        $stmt->execute([$promo_id]);
        echo json_encode(["status" => "success", "message" => "Промокод удален"]);
        exit;
    }
    
    // Если прилетел неизвестный экшен
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Неизвестное действие"]);
    exit;
}