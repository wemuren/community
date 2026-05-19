<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing id parameter"]);
    exit;
}

$id = (int)$_GET['id'];

try {
    // 1. Инфа о плейлисте (ИСПРАВЛЕНО: Теперь с джойном юзера, чтобы забрать его никнейм)
    $pl_stmt = $pdo->prepare("SELECT p.*, u.username 
                              FROM playlists p
                              JOIN users u ON p.user_id = u.id 
                              WHERE p.id = ?");
    $pl_stmt->execute([$id]);
    $playlist = $pl_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$playlist) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Playlist not found"]);
        exit;
    }

    // 2. Видео в этом плейлисте (с аватарками и юзернеймами)
    $v_stmt = $pdo->prepare("SELECT 
                                v.*, 
                                u.full_name, 
                                u.username, 
                                u.avatar, 
                                u.is_paid 
                             FROM videos v 
                             JOIN playlist_videos pv ON v.id = pv.video_id 
                             JOIN users u ON v.user_id = u.id
                             WHERE pv.playlist_id = ? 
                             ORDER BY pv.id DESC");
    $v_stmt->execute([$id]);
    $videos = $v_stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "playlist" => $playlist, 
        "videos" => $videos
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}