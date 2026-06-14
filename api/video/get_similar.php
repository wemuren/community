<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

$videoId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($videoId === 0) {
    echo json_encode([]);
    exit;
}

try {
    // 1. Получаем ID всех тегов текущего видео
    $tagStmt = $pdo->prepare("SELECT tag_id FROM video_tags WHERE video_id = ?");
    $tagStmt->execute([$videoId]);
    $tagIds = $tagStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($tagIds)) {
        // Если у видео нет тегов, отдаем просто последние видео (кроме текущего) и только от активных авторов
        $stmt = $pdo->prepare("SELECT v.*, u.username, u.full_name FROM videos v JOIN users u ON v.user_id = u.id WHERE v.id != ? AND u.is_active = 1 ORDER BY v.created_at DESC LIMIT 10");
        $stmt->execute([$videoId]);
        echo json_encode($stmt->fetchAll());
        exit;
    }

    // 2. Ищем похожие видео по совпадению тегов (только от активных авторов)
    $placeholders = implode(',', array_fill(0, count($tagIds), '?'));
    $sql = "
        SELECT v.*, u.username, u.full_name, COUNT(vt.tag_id) as common_tags_count
        FROM videos v
        JOIN video_tags vt ON v.id = vt.video_id
        JOIN users u ON v.user_id = u.id
        WHERE vt.tag_id IN ($placeholders) AND v.id != ? AND u.is_active = 1
        GROUP BY v.id
        ORDER BY common_tags_count DESC, v.created_at DESC
        LIMIT 10
    ";

    $params = array_merge($tagIds, [$videoId]);
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $similarVideos = $stmt->fetchAll();

    echo json_encode($similarVideos);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}