<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->user_id)) {
    $username = trim($data->username);
    $uid = (int)$data->user_id;

    // Ищем ник, который принадлежит ДРУГОМУ пользователю
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1");
    $stmt->execute([$username, $uid]);
    
    if ($stmt->fetch()) {
        echo json_encode(["status" => "taken", "message" => "Этот никнейм уже занят"]);
    } else {
        echo json_encode(["status" => "free"]);
    }
}