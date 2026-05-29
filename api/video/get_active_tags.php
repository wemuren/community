<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // ИСПРАВЛЕНО: Запрос вытаскивает только теги, привязанные к активным, незаблокированным видео
    $sql = "SELECT DISTINCT t.id, t.name 
            FROM tags t
            JOIN video_tags vt ON t.id = vt.tag_id
            JOIN videos v ON vt.video_id = v.id
            JOIN users u ON v.user_id = u.id
            WHERE u.is_active = 1
            ORDER BY t.name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $activeTags = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Возвращаем чистый массив активных хэштегов
    echo json_encode($activeTags);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}