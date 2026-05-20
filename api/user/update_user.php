<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// РУЧНОЙ ДЕБАГ: Если Маковский сервер сбоит, пишем логи в системную консоль
$userId = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$fullName = isset($_POST['full_name']) ? trim($_POST['full_name']) : '';
$username = isset($_POST['username']) ? trim($_POST['username']) : '';

// Страховка для некоторых сборок PHP на macOS
if (!$userId && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Если $_POST пустой, проверяем, не прилетели ли данные как JSON по ошибке
    $rawInput = json_decode(file_get_contents("php://input"), true);
    if (!empty($rawInput)) {
        $userId = isset($rawInput['id']) ? (int)$rawInput['id'] : 0;
        $fullName = isset($rawInput['full_name']) ? trim($rawInput['full_name']) : '';
        $username = isset($rawInput['username']) ? trim($rawInput['username']) : '';
    }
}

if (!$userId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID пользователя не указан. Сервер получил пустой POST."]);
    exit;
}

try {
    // 1. Проверяем уникальность никнейма
    $checkUser = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $checkUser->execute([$username, $userId]);
    if ($checkUser->fetch()) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Этот username уже занят другим автором"]);
        exit;
    }

    // 2. Получаем текущие файлы из базы
    $stmt = $pdo->prepare("SELECT avatar, banner, is_paid FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentUser) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Пользователь не найден"]);
        exit;
    }

    $avatarName = $currentUser['avatar'];
    $bannerName = $currentUser['banner'];

    // Настройка путей относительно корня api/
    $uploadBase = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
    $avatarFolder = $uploadBase . 'avatars' . DIRECTORY_SEPARATOR;
    $bannerFolder = $uploadBase . 'banners' . DIRECTORY_SEPARATOR;

    if (!is_dir($avatarFolder)) @mkdir($avatarFolder, 0777, true);
    if (!is_dir($bannerFolder)) @mkdir($bannerFolder, 0777, true);

    // 3. ПРОВЕРКА И ПЕРЕНОС АВАТАРКИ
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
        $newAvatarName = "av_" . $userId . "_" . time() . "." . $ext;
        $targetPath = $avatarFolder . $newAvatarName;

        if (move_uploaded_file($_FILES['avatar']['tmp_name'], $targetPath)) {
            if (!empty($currentUser['avatar']) && file_exists($avatarFolder . $currentUser['avatar'])) {
                @unlink($avatarFolder . $currentUser['avatar']);
            }
            $avatarName = $newAvatarName;
        }
    }

    // 4. ПРОВЕРКА И ПЕРЕНОС БАННЕРА
    if (isset($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
        if ((int)$currentUser['is_paid'] === 1) {
            $ext = strtolower(pathinfo($_FILES['banner']['name'], PATHINFO_EXTENSION));
            $newBannerName = "bn_" . $userId . "_" . time() . "." . $ext;
            $targetPath = $bannerFolder . $newBannerName;

            if (move_uploaded_file($_FILES['banner']['tmp_name'], $targetPath)) {
                if (!empty($currentUser['banner']) && file_exists($bannerFolder . $currentUser['banner'])) {
                    @unlink($bannerFolder . $currentUser['banner']);
                }
                $bannerName = $newBannerName;
            }
        }
    }

    // 5. Обновляем записи
    $sql = "UPDATE users SET full_name = ?, username = ?, avatar = ?, banner = ? WHERE id = ?";
    $pdo->prepare($sql)->execute([$fullName, $username, $avatarName, $bannerName, $userId]);

    // 6. Сборка свежих данных для фронта
    $res = $pdo->prepare("SELECT id, username, full_name, email, avatar, banner, is_paid, is_admin, is_active, channel_created, name_reset, premium_until FROM users WHERE id = ?");
    $res->execute([$userId]);
    $updatedUser = $res->fetch(PDO::FETCH_ASSOC);

    $updatedUser['id'] = (int)$updatedUser['id'];
    $updatedUser['is_paid'] = (int)$updatedUser['is_paid'];
    $updatedUser['is_admin'] = (int)$updatedUser['is_admin'];
    $updatedUser['is_active'] = (int)$updatedUser['is_active'];
    $updatedUser['channel_created'] = (int)$updatedUser['channel_created'];
    $updatedUser['name_reset'] = (int)$updatedUser['name_reset'];

    echo json_encode(["status" => "success", "user" => $updatedUser]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Критическая ошибка: " . $e->getMessage()]);
}