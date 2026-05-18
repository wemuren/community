<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'admin_auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sort = $_GET['sort'] ?? 'name';

    // Считаем и количество видео, и сумму просмотров
    // Используем COALESCE, чтобы вместо NULL был 0
    $sql = "SELECT 
                t.id, t.name, t.created_at, 
                COUNT(DISTINCT vt.video_id) as video_count, 
                SUM(COALESCE(v.views, 0)) as total_views
            FROM tags t
            LEFT JOIN video_tags vt ON t.id = vt.tag_id
            LEFT JOIN videos v ON vt.video_id = v.id
            GROUP BY t.id";

    // Обновленная логика сортировки
    switch ($sort) {
        case 'popular_videos':
            $sql .= " ORDER BY video_count DESC";
            break;
        case 'popular_views':
            $sql .= " ORDER BY total_views DESC";
            break;
        case 'newest':
            $sql .= " ORDER BY t.created_at DESC";
            break;
        default:
            $sql .= " ORDER BY t.name ASC";
    }
            
    $stmt = $pdo->query($sql);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    checkAdmin($pdo, $data->admin_id ?? 0);
    
    if ($data->action === 'add' && !empty($data->name)) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO tags (name) VALUES (?)");
        $stmt->execute([trim($data->name)]);
    } elseif ($data->action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM tags WHERE id = ?");
        $stmt->execute([(int)$data->id]);
    }
    echo json_encode(["status" => "success"]);
}