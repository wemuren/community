<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

$tagFilter = $_GET['tag'] ?? null;

try {
    $sql = "SELECT v.*, u.username, u.full_name, u.avatar, 
            (SELECT GROUP_CONCAT(t.name) 
             FROM video_tags vt 
             JOIN tags t ON vt.tag_id = t.id 
             WHERE vt.video_id = v.id) as tags_list
            FROM videos v
            JOIN users u ON v.user_id = u.id
            WHERE u.is_active = 1";  // ← скрываем видео забаненных

    if ($tagFilter) {
        $sql .= " AND v.id IN (
            SELECT vt.video_id 
            FROM video_tags vt 
            JOIN tags t ON vt.tag_id = t.id 
            WHERE t.name = :tag_name
        )";
    }

    $sql .= " ORDER BY v.created_at DESC";

    $stmt = $pdo->prepare($sql);
    if ($tagFilter) {
        $stmt->bindParam(':tag_name', $tagFilter);
    }

    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}