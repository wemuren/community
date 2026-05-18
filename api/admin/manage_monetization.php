<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'admin_auth.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    checkAdmin($pdo, $_GET['admin_id'] ?? 0);
    
    // Получаем цену из настроек
    $price = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'sub_price'")->fetchColumn() ?: '900';
    $promos = $pdo->query("SELECT * FROM promo_codes WHERE is_used = 0 ORDER BY id DESC")->fetchAll();
    // Находишь секцию GET в manage_monetization.php и меняешь запрос:
    $premiums = $pdo->query("SELECT id, full_name, username, avatar, premium_until FROM users WHERE is_paid = 1")->fetchAll();
    
    echo json_encode(["promos" => $promos, "premiums" => $premiums, "price" => $price]);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    checkAdmin($pdo, $data->admin_id ?? 0);

    if ($data->action === 'update_price') {
        $stmt = $pdo->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES ('sub_price', ?)");
        $stmt->execute([$data->new_price]);
        echo json_encode(["status" => "success"]);
    }
    
    if ($data->action === 'generate_promo') {
        $code = "COMM-" . strtoupper(bin2hex(random_bytes(2))) . "-" . strtoupper(bin2hex(random_bytes(2)));
        $stmt = $pdo->prepare("INSERT INTO promo_codes (code) VALUES (?)");
        $stmt->execute([$code]);
        echo json_encode(["status" => "success"]);
    }
}