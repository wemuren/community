<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../db.php';

try {
    $video_id = (int)($_POST['video_id'] ?? 0);
    $user_id = (int)($_POST['user_id'] ?? 0);
    $title = htmlspecialchars(trim($_POST['title'] ?? ''));
    $description = htmlspecialchars(trim($_POST['description'] ?? ''));

    if ($video_id <= 0 || $user_id <= 0 || empty($title)) {
        throw new Exception("Неполные данные для обновления");
    }

    // 1. Проверяем, что видео реально принадлежит этому пользователю
    $stmtCheck = $pdo->prepare("SELECT thumbnail FROM videos WHERE id = ? AND user_id = ?");
    $stmtCheck->execute([$video_id, $user_id]);
    $oldVideo = $stmtCheck->fetch();

    if (!$oldVideo) {
        throw new Exception("Доступ запрещен или видео не существует");
    }

    $pdo->beginTransaction();

    // 2. Обновляем основные данные
    $updateSql = "UPDATE videos SET title = :title, description = :desc WHERE id = :vid";
    $pdo->prepare($updateSql)->execute([
        ':title' => $title,
        ':desc'  => $description,
        ':vid'   => $video_id
    ]);

    // 3. Работа с ОБЛОЖКОЙ (если пришел новый файл)
    if (isset($_FILES['thumbnail'])) {
        $thumbFolder = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'thumbnails' . DIRECTORY_SEPARATOR;
        
        $t_ext = strtolower(pathinfo($_FILES['thumbnail']['name'], PATHINFO_EXTENSION));
        $allowed_t = ['jpg', 'jpeg', 'png'];
        
        if (in_array($t_ext, $allowed_t)) {
            $new_thumb_name = "thumb_" . uniqid() . "." . $t_ext;

            if (move_uploaded_file($_FILES['thumbnail']['tmp_name'], $thumbFolder . $new_thumb_name)) {
                // Удаляем старый файл, если он существует и это не дефолтная заглушка
                if (!empty($oldVideo['thumbnail']) && file_exists($thumbFolder . $oldVideo['thumbnail'])) {
                    @unlink($thumbFolder . $oldVideo['thumbnail']);
                }

                // Обновляем имя файла в базе
                $pdo->prepare("UPDATE videos SET thumbnail = ?, thumbnail_url = ? WHERE id = ?")
                    ->execute([$new_thumb_name, $new_thumb_name, $video_id]);
            }
        }
    }

    // 4. Обновление ТЕГОВ
    if (isset($_POST['tags'])) {
        $tags = json_decode($_POST['tags'], true);
        if (is_array($tags)) {
            // Удаляем старые связи
            $pdo->prepare("DELETE FROM video_tags WHERE video_id = ?")->execute([$video_id]);
            
            // Записываем новые
            if (!empty($tags)) {
                $tagStmt = $pdo->prepare("INSERT INTO video_tags (video_id, tag_id) VALUES (?, ?)");
                foreach ($tags as $tag_id) {
                    $tagStmt->execute([$video_id, (int)$tag_id]);
                }
            }
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Данные видео обновлены"]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}