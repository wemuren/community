<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['id'])) {
    $id = (int)$data['id'];
    // Удаляем только кастомные, системные — табу!
    $stmt = $pdo->prepare("DELETE FROM playlists WHERE id = ? AND type = 'custom'");
    if ($stmt->execute([$id])) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Не удалось удалить"]);
    }
}