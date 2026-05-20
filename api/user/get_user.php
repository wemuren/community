<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    
    // ИСПРАВЛЕНО: Добавлено поле u.email в выборку!
    $sql = "SELECT 
                u.id, 
                u.username, 
                u.full_name, 
                u.email, -- ВОТ ЭТО ПОЛЕ ОШЕЙНИК И ВОЗВРАЩАЕТ!
                u.avatar, 
                u.banner, 
                u.is_paid, 
                u.is_admin, 
                u.is_active, 
                u.channel_created, 
                u.name_reset,
                u.premium_until,
                (SELECT COUNT(*) FROM subscriptions WHERE followed_id = u.id) as subscribers 
            FROM users u 
            WHERE u.id = ?";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        // Приводим типы к числам, чтобы JS не путался (0/1)
        $user['subscribers'] = (int)$user['subscribers'];
        $user['is_paid'] = (int)$user['is_paid'];
        $user['is_admin'] = (int)$user['is_admin'];
        $user['is_active'] = (int)$user['is_active'];
        $user['channel_created'] = (int)$user['channel_created'];
        $user['name_reset'] = (int)$user['name_reset'];
        
        echo json_encode($user);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing id parameter"]);
}