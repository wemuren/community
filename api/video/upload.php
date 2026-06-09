<?php
// Выключаем лимиты времени для тяжелых файлов (10 минут)
set_time_limit(600); 

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../db.php';

try {
    // 1. Первичная проверка наличия данных
    if (!isset($_FILES['video'], $_FILES['thumbnail'], $_POST['user_id'])) {
        throw new Exception("Данные не получены. Проверьте лимиты post_max_size в php.ini");
    }

    $user_id = (int)$_POST['user_id'];
    $title = htmlspecialchars(trim($_POST['title']));
    $description = htmlspecialchars(trim($_POST['description']));

    // 2. Проверка статуса пользователя и лимитов веса
    $stmtUser = $pdo->prepare("SELECT is_paid FROM users WHERE id = ?");
    $stmtUser->execute([$user_id]);
    $dbUser = $stmtUser->fetch();

    if (!$dbUser) throw new Exception("Пользователь не найден");

    $is_premium = ((int)$dbUser['is_paid'] === 1);
    $max_bytes = $is_premium ? (1024 * 1024 * 1024) : (100 * 1024 * 1024);

    if ($_FILES['video']['size'] > $max_bytes) {
        $limit_text = $is_premium ? "1ГБ" : "100МБ";
        throw new Exception("Файл слишком велик. Ваш лимит: $limit_text");
    }

    // 3. Настройка путей
    $uploadBase = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
    $videoFolder = $uploadBase . 'videos' . DIRECTORY_SEPARATOR;
    $thumbFolder = $uploadBase . 'thumbnails' . DIRECTORY_SEPARATOR;

    // 4. Валидация форматов ВИДЕО (mp4, mov, mkv)
    $v_ext = strtolower(pathinfo($_FILES['video']['name'], PATHINFO_EXTENSION));
    $allowed_v = ['mp4', 'mov', 'mkv'];
    if (!in_array($v_ext, $allowed_v)) throw new Exception("Формат .$v_ext не поддерживается. Используйте MP4, MOV или MKV");

    // 5. Валидация форматов ФОТО (jpg, jpeg, png)
    $t_ext = strtolower(pathinfo($_FILES['thumbnail']['name'], PATHINFO_EXTENSION));
    $allowed_t = ['jpg', 'jpeg', 'png'];
    if (!in_array($t_ext, $allowed_t)) throw new Exception("Формат обложки .$t_ext не поддерживается. Используйте JPG или PNG");

    // Генерация имен
    $new_video_name = "vid_" . uniqid() . "." . $v_ext;
    $new_thumb_name = "thumb_" . uniqid() . "." . $t_ext;

    // 6. Сохранение файлов
    if (!move_uploaded_file($_FILES['video']['tmp_name'], $videoFolder . $new_video_name)) {
        throw new Exception("Ошибка при сохранении видео на сервер");
    }

    if (!move_uploaded_file($_FILES['thumbnail']['tmp_name'], $thumbFolder . $new_thumb_name)) {
        // Если обложка не сохранилась, удаляем уже загруженное видео
        @unlink($videoFolder . $new_video_name);
        throw new Exception("Ошибка при сохранении обложки");
    }

    // 7. Запись в БД (строго по твоему дампу: id, user_id, title, description, video_url, thumbnail, thumbnail_url, views)
    $pdo->beginTransaction();

    $sql = "INSERT INTO videos (user_id, title, description, video_url, thumbnail, thumbnail_url, views) 
            VALUES (:uid, :title, :desc, :v_url, :thumb, :t_url, 0)";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':uid'   => $user_id,
        ':title' => $title,
        ':desc'  => $description,
        ':v_url' => $new_video_name,
        ':thumb' => $new_thumb_name,
        ':t_url' => $new_thumb_name 
    ]);
    
    $video_id = $pdo->lastInsertId();

    // Обработка ТЕГОВ (если переданы)
    if (!empty($_POST['tags'])) {
        $tags = json_decode($_POST['tags'], true);
        if (is_array($tags)) {
            $tag_stmt = $pdo->prepare("INSERT INTO video_tags (video_id, tag_id) VALUES (?, ?)");
            foreach ($tags as $tag_id) {
                $tag_stmt->execute([$video_id, (int)$tag_id]);
            }
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "video_id" => $video_id]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    
    // Чистим мусор, если что-то пошло не так после загрузки файлов
    if (isset($videoFolder, $new_video_name) && file_exists($videoFolder . $new_video_name)) @unlink($videoFolder . $new_video_name);
    if (isset($thumbFolder, $new_thumb_name) && file_exists($thumbFolder . $new_thumb_name)) @unlink($thumbFolder . $new_thumb_name);
    
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}