<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once '../db.php';

$id = (int)$_GET['id'];

// 1. Инфа о плейлисте
$pl_stmt = $pdo->prepare("SELECT * FROM playlists WHERE id = ?");
$pl_stmt->execute([$id]);
$playlist = $pl_stmt->fetch(PDO::FETCH_ASSOC);

// 2. Видео в этом плейлисте (теперь с аватарками и юзернеймами)
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