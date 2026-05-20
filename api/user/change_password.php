<?php
// 1. ПЕРВЫМ ДЕЛОМ ОТДАЕМ ЗАГОЛОВКИ БРАУЗЕРУ
header("Access-Control-Allow-Origin: *"); // Вместо звезды лучше явно указать твой фронт
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// 2. СРАЗУ ГАСИМ ПРЕДВАРИТЕЛЬНЫЙ ЗАПРОС OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 3. И ТОЛЬКО ТЕПЕРЬ ПОДКЛЮЧАЕМ БАЗУ ДАННЫХ
require_once '../db.php';
require_once '../db.php';

// Если браузер делает предварительный запрос OPTIONS, сразу отвечаем 200 OK и выходим
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Читаем сырой JSON-боди, который присылает Axios
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['old_password']) || !isset($data['new_password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Заполните все поля"]);
    exit;
}

$user_id = (int)$data['user_id'];
$old_password = trim($data['old_password']);
$new_password = trim($data['new_password']);

try {
    // 1. Ищем пользователя в базе данных
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404); // Исправлен код ответа на 404 (был некорректный 44)
        echo json_encode(["success" => false, "message" => "Пользователь не найден"]);
        exit;
    }

    // 2. Проверяем старый пароль (учитываем как хэш, так и обычную строку)
    if (!password_verify($old_password, $user['password']) && $old_password !== $user['password']) {
        http_response_code(400); // Возвращаем ошибку 400 Bad Request при неверном пароле
        echo json_encode(["success" => false, "message" => "Неверный текущий пароль"]);
        exit;
    }

    // 3. Хэшируем новый пароль через дефолтный безопасный алгоритм
    $new_hash = password_hash($new_password, PASSWORD_DEFAULT);

    // 4. Обновляем пароль в базе данных
    $update_stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $update_stmt->execute([$new_hash, $user_id]);

    // Возвращаем строго структурированный ответ, который ждет фронтенд
    echo json_encode([
        "success" => true,
        "message" => "Пароль успешно изменен"
    ]);
    exit; /* ВАЖНО: Принудительно завершаем выполнение скрипта здесь */

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Ошибка сервера: " . $e->getMessage()]);
    exit;
}