<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));
// Берем id из запроса
$u_id = isset($data->user_id) ? (int)$data->user_id : 0;

if ($u_id > 0) {
    try {
       $pdo->beginTransaction();

// 1. Теги видео
$pdo->prepare("DELETE FROM video_tags WHERE video_id IN (SELECT id FROM videos WHERE user_id = ?)")->execute([$u_id]);

// 2. Видео
$pdo->prepare("DELETE FROM videos WHERE user_id = ?")->execute([$u_id]);

// 3. Плейлисты
$pdo->prepare("DELETE FROM playlist_videos WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = ?)")->execute([$u_id]);
$pdo->prepare("DELETE FROM playlists WHERE user_id = ?")->execute([$u_id]);

// 4. Комментарии
$pdo->prepare("DELETE FROM comments WHERE user_id = ?")->execute([$u_id]);

// 5. Подписки
$pdo->prepare("DELETE FROM subscriptions WHERE follower_id = ? OR followed_id = ?")->execute([$u_id, $u_id]);

// 6. ⬅️ НОВОЕ: использования промокодов
$pdo->prepare("DELETE FROM promo_usages WHERE user_id = ?")->execute([$u_id]);

// 7. ⬅️ НОВОЕ: обнуляем used_by в промокодах
$pdo->prepare("UPDATE promo_codes SET used_by = NULL WHERE used_by = ?")->execute([$u_id]);

// 8. Email верификации
$email_res = $pdo->prepare("SELECT email FROM users WHERE id = ?");
$email_res->execute([$u_id]);
$email = $email_res->fetchColumn();
if ($email) {
    $pdo->prepare("DELETE FROM email_verifications WHERE email = ?")->execute([$email]);
}

// 9. Сам пользователь
$pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$u_id]);

$pdo->commit();
        echo json_encode(["status" => "success", "message" => "Прощай, ковбой! Аккаунт удален."]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        // Выводим точную ошибку базы для отладки
        echo json_encode(["status" => "error", "message" => "Ошибка БД: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID не передан"]);
}