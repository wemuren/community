<?php
require_once '../db.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

$data = json_decode(file_get_contents("php://input"), true);
$video_id = (int)($data['video_id'] ?? 0);

if ($video_id <= 0) {
    echo json_encode(["error" => "no video_id"]);
    exit;
}

// Только +1 к счётчику просмотров
$pdo->prepare("UPDATE videos SET views = views + 1 WHERE id = ?")->execute([$video_id]);

echo json_encode(["status" => "ok"]);