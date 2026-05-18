<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php'; 

$id = (int)($_GET['id'] ?? 0);
$user_id = (int)($_GET['user_id'] ?? 0);

if ($id <= 0 || $user_id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Некорректные параметры"]);
    exit;
}

try {
    // 1. Получаем само видео с проверкой владельца
    $stmt = $pdo->prepare("SELECT * FROM videos WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user_id]);
    $video = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$video) {
        http_response_code(404);
        echo json_encode(["error" => "Видео не найдено или доступ запрещен"]);
        exit;
    }

    // 2. Получаем теги этого видео
    $tagStmt = $pdo->prepare("
        SELECT t.id, t.name 
        FROM tags t 
        JOIN video_tags vt ON t.id = vt.tag_id 
        WHERE vt.video_id = ?
    ");
    $tagStmt->execute([$id]);
    $video['tags'] = $tagStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($video);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}