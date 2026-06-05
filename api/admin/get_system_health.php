<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'admin_auth.php';
checkAdmin($pdo, $_REQUEST['admin_id'] ?? 0);

// Всегда пишем в локальный файл рядом со скриптом
$logPath = __DIR__ . '/server_errors.log';

// Направляем PHP-ошибки в этот файл
ini_set('error_log', $logPath);
ini_set('log_errors', '1');

// --- ОЧИСТКА (POST) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    file_put_contents($logPath, '');
    echo json_encode(["status" => "success", "message" => "Логи очищены"]);
    exit;
}

// --- ПОЛУЧЕНИЕ ДАННЫХ (GET) ---
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
        "videos"  => $base . 'videos',
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

    // Читаем последние 30 строк лога (файл может быть пустым — это нормально)
    $logs = [];
    if (file_exists($logPath) && filesize($logPath) > 0) {
        $lines = file($logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $logs = array_slice($lines, -30);
    }

    echo json_encode([
        "storage"      => $sizes,
        "total_weight" => formatSize($totalBytes),
        "logs"         => $logs
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}