<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

if (isset($_GET['user_id'])) {
    $user_id = (int)$_GET['user_id'];
    
    // Магия SQL: берем видео только тех, кто в таблице подписок связан с нами
   $sql = "SELECT v.*, u.username, u.full_name, u.avatar, u.is_paid 
        FROM videos v
        JOIN users u ON v.user_id = u.id
        JOIN subscriptions s ON v.user_id = s.followed_id
        WHERE s.follower_id = ?
        ORDER BY v.created_at DESC";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    echo json_encode($stmt->fetchAll());
}