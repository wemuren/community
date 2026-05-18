<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));
$uid = isset($data->user_id) ? (int)$data->user_id : 0;
$pid = isset($data->playlist_id) ? (int)$data->playlist_id : 0;

if ($uid > 0 && $pid > 0) {
    try {
        // Проверяем, сохранено ли уже
        $stmt = $pdo->prepare("SELECT id FROM playlist_saves WHERE user_id = ? AND playlist_id = ?");
        $stmt->execute([$uid, $pid]);
        $exists = $stmt->fetch();

        if ($exists) {
            // Если есть — удаляем
            $pdo->prepare("DELETE FROM playlist_saves WHERE user_id = ? AND playlist_id = ?")->execute([$uid, $pid]);
            echo json_encode(["status" => "unsaved", "message" => "Удалено из коллекции"]);
        } else {
            // Если нет — добавляем
            $pdo->prepare("INSERT INTO playlist_saves (user_id, playlist_id) VALUES (?, ?)")->execute([$uid, $pid]);
            echo json_encode(["status" => "saved", "message" => "Добавлено в коллекцию"]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}