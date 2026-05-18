<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

require_once '../db.php';

// Читаем JSON из тела запроса
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->title) && !empty($data->user_id)) {
    try {
        // Добавляем user_id в WHERE или проверку, чтобы не создавать лишнего, 
        // но здесь просто INSERT
        $stmt = $pdo->prepare("INSERT INTO playlists (user_id, title, is_private, type) VALUES (?, ?, ?, 'custom')");
        
        $success = $stmt->execute([
            (int)$data->user_id,
            trim($data->title),
            (int)($data->is_private ?? 0)
        ]);

        if ($success) {
            echo json_encode([
                "status" => "success", 
                "playlist_id" => $pdo->lastInsertId(),
                "message" => "Плейлист создан"
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Не удалось сохранить в базу"]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Название или ID пользователя пусты"]);
}