<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

if (isset($_GET['user_id'])) {
    $user_id = (int)$_GET['user_id'];
    $viewer_id = isset($_GET['viewer_id']) ? (int)$_GET['viewer_id'] : 0;
    try {
        $sql = "SELECT 
                    v.id, v.title, v.video_url, v.thumbnail, v.views, v.created_at,
                    u.username, u.full_name, u.avatar, u.is_paid, u.is_active
                FROM videos v
                JOIN users u ON v.user_id = u.id
                WHERE v.user_id = ?
                  AND (u.is_active = 1 OR u.id = ?)
                ORDER BY v.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id, $viewer_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "user_id не передан"]);
}
?>