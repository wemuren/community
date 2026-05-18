<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db.php';

// Обработка preflight запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$userId = (int)($_POST['id'] ?? 0);
$fullName = $_POST['full_name'] ?? '';
$username = $_POST['username'] ?? '';

if (!$userId) {
    echo json_encode(["status" => "error", "message" => "ID пользователя не указан"]);
    exit;
}

try {
    // 1. Проверка уникальности username
    $checkUser = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $checkUser->execute([$username, $userId]);
    if ($checkUser->fetch()) {
        echo json_encode(["status" => "error", "message" => "Этот username уже занят"]);
        exit;
    }

    // 2. Получаем текущие данные (is_paid важен для баннера)
    $stmt = $pdo->prepare("SELECT avatar, banner, is_paid FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch();

    $avatarName = $currentUser['avatar'];
    $bannerName = $currentUser['banner'];

    // --- ЛОГИКА ПУТЕЙ (Жесткая привязка к папкам) ---
    // DIRECTORY_SEPARATOR сам поставит / или \ в зависимости от Windows/Linux
    $uploadBase = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
    $avatarFolder = $uploadBase . 'avatars' . DIRECTORY_SEPARATOR;
    $bannerFolder = $uploadBase . 'banners' . DIRECTORY_SEPARATOR;

    // Авто-создание папок, если их нет
    if (!is_dir($avatarFolder)) mkdir($avatarFolder, 0777, true);
    if (!is_dir($bannerFolder)) mkdir($bannerFolder, 0777, true);

    // 3. ОБРАБОТКА АВАТАРКИ
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
        $newAvatarName = "av_" . $userId . "_" . time() . "." . $ext;
        $targetPath = $avatarFolder . $newAvatarName;

        if (move_uploaded_file($_FILES['avatar']['tmp_name'], $targetPath)) {
            // Удаляем старый файл
            if ($currentUser['avatar'] && file_exists($avatarFolder . $currentUser['avatar'])) {
                @unlink($avatarFolder . $currentUser['avatar']);
            }
            $avatarName = $newAvatarName;
        } else {
            error_log("Ошибка загрузки аватара в: " . $targetPath);
        }
    }

    // 4. ОБРАБОТКА БАННЕРА (Только для Premium)
    if (isset($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
        if ((int)$currentUser['is_paid'] === 1) {
            $ext = strtolower(pathinfo($_FILES['banner']['name'], PATHINFO_EXTENSION));
            $newBannerName = "bn_" . $userId . "_" . time() . "." . $ext;
            $targetPath = $bannerFolder . $newBannerName;

            if (move_uploaded_file($_FILES['banner']['tmp_name'], $targetPath)) {
                if ($currentUser['banner'] && file_exists($bannerFolder . $currentUser['banner'])) {
                    @unlink($bannerFolder . $currentUser['banner']);
                }
                $bannerName = $newBannerName;
            }
        }
    }

    // 5. ОБНОВЛЯЕМ БАЗУ
    $sql = "UPDATE users SET full_name = ?, username = ?, avatar = ?, banner = ? WHERE id = ?";
    $pdo->prepare($sql)->execute([$fullName, $username, $avatarName, $bannerName, $userId]);

    // 6. Получаем финальный объект для фронтенда
    $res = $pdo->prepare("SELECT id, username, full_name, avatar, banner, is_paid, is_admin, channel_created, premium_until FROM users WHERE id = ?");
    $res->execute([$userId]);
    $updatedUser = $res->fetch(PDO::FETCH_ASSOC);

    // Приведение типов для JS
    $updatedUser['is_paid'] = (int)$updatedUser['is_paid'];
    $updatedUser['is_admin'] = (int)$updatedUser['is_admin'];

    echo json_encode(["status" => "success", "user" => $updatedUser]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}