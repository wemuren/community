<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id) && !empty($data->video_id) && !empty($data->type)) {
    $u_id = (int)$data->user_id;
    $v_id = (int)$data->video_id;
    $type = $data->type;
    $title = ($type === 'liked') ? 'Понравившееся' : 'Смотреть позже';

    try {
        // 1. Находим или создаем плейлист
        $stmt = $pdo->prepare("SELECT id FROM playlists WHERE user_id = ? AND type = ?");
        $stmt->execute([$u_id, $type]);
        $playlist = $stmt->fetch();

        if (!$playlist) {
            $ins = $pdo->prepare("INSERT INTO playlists (user_id, title, type, is_private) VALUES (?, ?, ?, 1)");
            $ins->execute([$u_id, $title, $type]);
            $playlist_id = $pdo->lastInsertId();
        } else {
            $playlist_id = (int)$playlist['id'];
        }

        // 2. Проверяем наличие видео
        $check = $pdo->prepare("SELECT id FROM playlist_videos WHERE playlist_id = ? AND video_id = ?");
        $check->execute([$playlist_id, $v_id]);
        $exists = $check->fetch();

        if ($exists) {
            // УДАЛЯЕМ
            $del = $pdo->prepare("DELETE FROM playlist_videos WHERE playlist_id = ? AND video_id = ?");
            $del->execute([$playlist_id, $v_id]);
            echo json_encode(["status" => "removed", "message" => "Удалено из " . $title]);
        } else {
            // ДОБАВЛЯЕМ
            $add = $pdo->prepare("INSERT INTO playlist_videos (playlist_id, video_id) VALUES (?, ?)");
            $add->execute([$playlist_id, $v_id]);
            echo json_encode(["status" => "added", "message" => "Добавлено в " . $title]);
        }
    } catch (Exception $e) {
        // Если что-то пошло не так, вернем ошибку красиво, а не 500-й ошибкой
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}