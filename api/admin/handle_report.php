<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once 'admin_auth.php';
// Убедись, что db.php подключен либо здесь, либо внутри admin_auth.php
// require_once '../db.php'; 

$data = json_decode(file_get_contents("php://input"));
checkAdmin($pdo, $data->admin_id ?? 0);

if (!empty($data->target_id) && !empty($data->target_type) && !empty($data->action)) {
    try {
        $targetId = (int)$data->target_id;
        $type = $data->target_type; // 'video' или 'user'

        if ($data->action === 'delete') {
            // ФИЗИЧЕСКОЕ УДАЛЕНИЕ
            if ($type === 'video') {
                // Удаляем само видео
                $stmt = $pdo->prepare("DELETE FROM videos WHERE id = ?");
                $stmt->execute([$targetId]);
                
                // Удаляем связанные теги и записи из плейлистов (если нет каскадного удаления в БД)
                $pdo->prepare("DELETE FROM video_tags WHERE video_id = ?")->execute([$targetId]);
                $pdo->prepare("DELETE FROM playlist_videos WHERE video_id = ?")->execute([$targetId]);
            } else {
                // Удаляем пользователя
                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$targetId]);
            }

            // В любом случае чистим жалобы на этот объект
            $stmt = $pdo->prepare("DELETE FROM reports WHERE target_id = ? AND target_type = ?");
            $stmt->execute([$targetId, $type]);

        } elseif ($data->action === 'ignore') {
            // Просто удаляем жалобу, контент остается
            $stmt = $pdo->prepare("DELETE FROM reports WHERE target_id = ? AND target_type = ?");
            $stmt->execute([$targetId, $type]);
        }

        echo json_encode(["status" => "success", "message" => "Объект удален навсегда"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}