<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id) && !empty($data->video_id) && !empty($data->text)) {
    try {
        // 1. Проверяем, активен ли Premium у пользователя
        $u_stmt = $pdo->prepare("SELECT is_paid, premium_until FROM users WHERE id = ?");
        $u_stmt->execute([$data->user_id]);
        $user = $u_stmt->fetch();

        $isPremium = ($user['is_paid'] == 1 && new DateTime($user['premium_until']) > new DateTime());

        if (!$isPremium) {
            http_response_code(403);
            echo json_encode(["message" => "Комментарии доступны только Premium-пользователям"]);
            exit;
        }

        // 2. Добавляем комментарий
        $stmt = $pdo->prepare("INSERT INTO comments (video_id, user_id, text) VALUES (?, ?, ?)");
        $stmt->execute([$data->video_id, $data->user_id, trim($data->text)]);

        echo json_encode(["status" => "success"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}