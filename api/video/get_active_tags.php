<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

try {
    // Используем INNER JOIN, чтобы выбрать только те теги, которые есть в video_tags
    // DISTINCT гарантирует, что тег не повторится, если к нему привязано много видео
    $sql = "SELECT DISTINCT t.id, t.name 
            FROM tags t
            INNER JOIN video_tags vt ON t.id = vt.tag_id
            ORDER BY t.name ASC";

    $stmt = $pdo->query($sql);
    $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($tags);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}