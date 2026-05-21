<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
require_once 'admin_auth.php';
require_once '../db.php';

$admin_id = $_GET['admin_id'] ?? 0;
$search = $_GET['search'] ?? '';
$sort = $_GET['sort'] ?? 'newest';

// Параметры для страниц
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = 9; // По 9 каналов на страницу
$offset = ($page - 1) * $limit;

checkAdmin($pdo, $admin_id);

try {
    $sortOptions = [
        'newest' => 'u.created_at DESC',
        'oldest' => 'u.created_at ASC',
        'name'   => 'u.full_name ASC',
        'popular' => 'sub_count DESC',
        'videos'  => 'video_count DESC'
    ];

    $orderBy = $sortOptions[$sort] ?? $sortOptions['newest'];

    // 1. Сначала считаем ОБЩЕЕ количество записей с учетом поиска
    $countSql = "SELECT COUNT(*) FROM users u WHERE u.id != ?";
    $countParams = [(int)$admin_id];

    if (!empty($search)) {
        $countSql .= " AND (u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)";
        $searchParam = "%$search%";
        $countParams[] = $searchParam;
        $countParams[] = $searchParam;
        $countParams[] = $searchParam;
    }

    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($countParams);
    $totalRecords = $countStmt->fetchColumn();
    $totalPages = ceil($totalRecords / $limit);

    // 2. Основной запрос (ДОБАВЛЕНО ПОЛЕ u.email)
    $sql = "SELECT 
                u.id, u.username, u.full_name, u.email, u.avatar, u.banner, 
                u.is_paid, u.is_active, u.created_at, u.name_reset,
                (SELECT COUNT(*) FROM videos WHERE user_id = u.id) as video_count,
                (SELECT COUNT(*) FROM subscriptions WHERE followed_id = u.id) as sub_count
            FROM users u
            WHERE u.id != ? ";
            
    if (!empty($search)) {
        $sql .= " AND (u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?) ";
    }

    $sql .= " ORDER BY $orderBy LIMIT $limit OFFSET $offset";
    
    $stmt = $pdo->prepare($sql);
    
    // Используем те же параметры, что и для счета
    $stmt->execute($countParams);
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Возвращаем объект с данными и мета-инфой
    echo json_encode([
        "channels" => $results,
        "total_pages" => $totalPages,
        "current_page" => $page,
        "total_count" => $totalRecords
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}