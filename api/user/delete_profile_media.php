<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../db.php';
$data = json_decode(file_get_contents("php://input"));

if (empty($data->user_id) || empty($data->type)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Данные не полные"]);
    exit;
}

$user_id = (int)$data->user_id;
$type = trim($data->type); // 'avatar' или 'banner'

try {
    // 1. Вытаскиваем имя текущего файла, чтобы стереть его с диска
    $stmt = $pdo->prepare("SELECT avatar, banner FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(44);
        echo json_encode(["success" => false, "message" => "Пользователь не найден"]);
        exit;
    }

    if ($type === 'avatar' && !empty($user['avatar'])) {
        $file_path = "../uploads/avatars/" . $user['avatar'];
        if (file_exists($file_path)) { @unlink($file_path); }
        $pdo->prepare("UPDATE users SET avatar = NULL WHERE id = ?")->execute([$user_id]);
    } 
    
    if ($type === 'banner' && !empty($user['banner'])) {
        $file_path = "../uploads/banners/" . $user['banner'];
        if (file_exists($file_path)) { @unlink($file_path); }
        $pdo->prepare("UPDATE users SET banner = NULL WHERE id = ?")->execute([$user_id]);
    }

    // 2. Возвращаем обновленный объект пользователя для localStorage фронтенда
    $fresh_stmt = $pdo->prepare("SELECT id, username, full_name, email, avatar, banner, is_paid, is_admin, is_active, channel_created, name_reset FROM users WHERE id = ?");
    $fresh_stmt->execute([$user_id]);
    $fresh_user = $fresh_stmt->fetch(PDO::FETCH_ASSOC);

    // Приведение типов
    $fresh_user['is_paid'] = (int)$fresh_user['is_paid'];
    $fresh_user['is_admin'] = (int)$fresh_user['is_admin'];
    $fresh_user['is_active'] = (int)$fresh_user['is_active'];
    $fresh_user['channel_created'] = (int)$fresh_user['channel_created'];
    $fresh_user['name_reset'] = (int)$fresh_user['name_reset'];

    echo json_encode(["success" => true, "user" => $fresh_user]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}