<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';

try {
    // Тянем цену из нашей таблицы настроек
    $price = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'sub_price'")->fetchColumn() ?: '900';
    
    echo json_encode(["sub_price" => $price]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}