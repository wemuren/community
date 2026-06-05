<?php
require_once '../db.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$raw = isset($_GET['q']) ? trim($_GET['q']) : '';

$results = ["users" => [], "videos" => [], "courses" => [], "playlists" => []];

if (mb_strlen($raw) < 1) {
    echo json_encode($results);
    exit;
}

// Нормализация: убираем # и @ в начале, приводим к нижнему регистру
$isTag     = mb_substr($raw, 0, 1) === '#';
$isMention = mb_substr($raw, 0, 1) === '@';
$clean     = ($isTag || $isMention) ? mb_substr($raw, 1) : $raw;
$clean     = mb_strtolower(trim($clean));

if (mb_strlen($clean) < 1) {
    echo json_encode($results);
    exit;
}

$like = "%{$clean}%";

try {
    // ── ПОЛЬЗОВАТЕЛИ ────────────────────────────────────────────────────────
    // Всегда ищем, если это не чистый хештег
    if (!$isTag) {
        $u_stmt = $pdo->prepare("
            SELECT id, username, full_name, avatar, is_paid
            FROM users
            WHERE (LOWER(username) LIKE ? OR LOWER(full_name) LIKE ?)
              AND is_active = 1
              AND is_admin = 0 -- ИСПРАВЛЕНО: Скрываем системные аккаунты администраторов
            ORDER BY
                CASE WHEN LOWER(username) = ? THEN 0
                     WHEN LOWER(username) LIKE ? THEN 1
                     ELSE 2 END
            LIMIT 10
        ");
        $u_stmt->execute([$like, $like, $clean, "{$clean}%"]);
        $results['users'] = $u_stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ── ВИДЕО ────────────────────────────────────────────────────────────────
    // Ищем по названию + по тегам (нечёткое совпадение)
    if (!$isMention) {
        $v_stmt = $pdo->prepare("
            SELECT DISTINCT v.*, u.username, u.full_name, u.avatar, u.is_paid
            FROM videos v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN video_tags vt ON v.id = vt.video_id
            LEFT JOIN tags t ON vt.tag_id = t.id
            WHERE u.is_active = 1
              AND u.is_admin = 0 -- ИСПРАВЛЕНО: Ролики админов не попадают в выдачу контента
              AND (
                  LOWER(v.title) LIKE ?
                  OR LOWER(t.name) LIKE ?
              )
            ORDER BY
                CASE WHEN LOWER(v.title) LIKE ? THEN 0 ELSE 1 END,
                v.views DESC
            LIMIT 20
        ");
        $v_stmt->execute([$like, $like, "{$clean}%"]);
        $results['videos'] = $v_stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ── ПЛЕЙЛИСТЫ ────────────────────────────────────────────────────────────
    if (!$isMention) {
        $p_stmt = $pdo->prepare("
            SELECT p.*, u.username, u.full_name AS author_name,
                (SELECT COUNT(*) FROM playlist_videos WHERE playlist_id = p.id) AS video_count,
                (SELECT pv2.thumbnail
                 FROM playlist_videos plv
                 JOIN videos pv2 ON plv.video_id = pv2.id
                 WHERE plv.playlist_id = p.id
                 ORDER BY plv.added_at DESC LIMIT 1) AS last_video_thumbnail
            FROM playlists p
            JOIN users u ON p.user_id = u.id
            WHERE LOWER(p.title) LIKE ?
              AND p.is_private = 0
              AND p.type = 'custom'
              AND u.is_active = 1
              AND u.is_admin = 0 -- ИСПРАВЛЕНО: Исключаем технические или системные плейлисты администраторов
            ORDER BY video_count DESC
            LIMIT 10
        ");
        $p_stmt->execute([$like]);
        $results['playlists'] = $p_stmt->fetchAll(PDO::FETCH_ASSOC);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
    exit;
}

echo json_encode($results);