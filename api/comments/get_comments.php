<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

$video_id = isset($_GET['video_id']) ? (int)$_GET['video_id'] : 0;

if ($video_id > 0) {
    try {
        $sql = "SELECT c.*, u.username, u.full_name, u.avatar, u.is_paid 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.video_id = ? 
                ORDER BY c.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$video_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}