<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'admin_auth.php';
// Проверка прав администратора перед любым действием
checkAdmin($pdo, $_REQUEST['admin_id'] ?? 0); 

$logPath = ini_get('error_log');

// --- ОБРАБОТКА ОЧИСТКИ (POST) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($logPath && file_exists($logPath)) {
        // Записываем пустую строку в файл
        file_put_contents($logPath, ""); 
        echo json_encode(["status" => "success", "message" => "Логи очищены"]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "Файл логов не найден или не настроен"]);
    }
    exit;
}

// --- ОБРАБОТКА ПОЛУЧЕНИЯ ДАННЫХ (GET) ---
function getDirSize($dir) {
    $size = 0;
    if (!is_dir($dir)) return 0;
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir)) as $file) {
        if ($file->isFile()) $size += $file->getSize();
    }
    return $size;
}

function formatSize($bytes) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    for ($i = 0; $bytes > 1024 && $i < 4; $i++) $bytes /= 1024;
    return round($bytes, 2) . ' ' . $units[$i];
}

try {
    $base = '../uploads/';
    $folders = [
        "videos" => $base . 'videos',
        "avatars" => $base . 'avatars',
        "banners" => $base . 'banners',
        "thumbs"  => $base . 'thumbnails'
    ];

    $sizes = [];
    $totalBytes = 0;

    foreach ($folders as $key => $path) {
        $bytes = getDirSize($path);
        $totalBytes += $bytes;
        $sizes[$key] = formatSize($bytes);
    }

    $health = [
        "storage" => $sizes,
        "total_weight" => formatSize($totalBytes),
        "logs" => []
    ];

    if ($logPath && file_exists($logPath)) {
        $lines = file($logPath);
        // Берем последние 30 строк для терминала
        $health['logs'] = array_map('trim', array_slice($lines, -30));
    }

    echo json_encode($health);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}