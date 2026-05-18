<?php
// Проверка: может ли юзер смотреть это видео?
function canWatch($user, $video) {
    if ($video['is_premium'] == 0) return true; // Бесплатное — всем
    if ($user && $user['is_paid'] == 1) return true; // Премиум — платным
    return false; // Остальным — фига
}

// Проверка: может ли юзер публиковать (не забанен ли)?
function isBanned($user) {
    return (int)$user['is_active'] === 0;
}

// Лимиты веса (в мегабайтах)
function getUploadLimit($user) {
    return ($user['is_paid'] == 1) ? 500 : 50; // 500МБ против 50МБ
}