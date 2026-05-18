<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE"); // Разрешаем методы
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"); // РАЗРЕШАЕМ Content-Type
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['id'])) {
    $id = (int)$data['id'];
    $title = trim($data['title']);
    $is_private = (int)$data['is_private'];

    // Запрещаем переименовывать системные плейлисты (Liked/Watch Later)
    $sql = "UPDATE playlists SET title = ?, is_private = ? WHERE id = ? AND type = 'custom'";
    $stmt = $pdo->prepare($sql);
    
    if ($stmt->execute([$title, $is_private, $id])) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Ошибка обновления"]);
    }
}
