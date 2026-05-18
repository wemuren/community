<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

if (isset($_GET['user_id'])) {
    $user_id = (int)$_GET['user_id'];
    
    // ДОБАВИЛИ: u.avatar и u.is_paid
    $sql = "SELECT 
                u.id, 
                u.username, 
                u.full_name, 
                u.avatar, 
                u.is_paid 
            FROM subscriptions s 
            JOIN users u ON s.followed_id = u.id 
            WHERE s.follower_id = ?";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    
    // FETCH_ASSOC, чтобы не дублировать данные индексами
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}