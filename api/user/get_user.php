<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

if (isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    
    // Добавляем все недостающие поля: avatar, banner, is_paid, is_active, name_reset
   $sql = "SELECT 
                id, 
                username, 
                full_name, 
                avatar, 
                banner, 
                is_paid, 
                is_admin, 
                is_active, 
                channel_created, 
                name_reset,
                premium_until, -- ВОТ ЭТОГО НЕ ХВАТАЛО!
                (SELECT COUNT(*) FROM subscriptions WHERE followed_id = u.id) as subscribers 
            FROM users u 
            WHERE id = ?";
            
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
}