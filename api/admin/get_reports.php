<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'admin_auth.php';
checkAdmin($pdo, $_GET['admin_id'] ?? 0);

try {
    // Собираем всё: и обложки видео, и баннеры юзеров
    $sql = "SELECT 
                r.target_id, 
                r.target_type, 
                COUNT(*) as report_count,
                GROUP_CONCAT(r.reason SEPARATOR ' | ') as all_reasons,
                
                -- Логика для названия объекта
                CASE 
                    WHEN r.target_type = 'video' THEN v.title
                    WHEN r.target_type = 'user' THEN u.full_name
                END as target_name,

                -- Данные для ВИДЕО (обложка)
                v.thumbnail as target_thumbnail,

                -- Данные для ЮЗЕРА (аватар и баннер)
                u.avatar as user_avatar,
                u.username as user_handle,
                u.banner as banner, -- ОБЯЗАТЕЛЬНО для вывода баннера
                u.is_paid as is_paid,
                u.is_active as is_active,
                u.created_at as created_at,
                u.name_reset as name_reset

            FROM reports r
            -- Присоединяем видео, если жалоба на видео
            LEFT JOIN videos v ON (r.target_type = 'video' AND v.id = r.target_id)
            -- Присоединяем юзера: либо если жалоба на него, либо если он автор видео
            LEFT JOIN users u ON (
                (r.target_type = 'user' AND u.id = r.target_id) 
                OR 
                (r.target_type = 'video' AND u.id = v.user_id)
            )
            GROUP BY r.target_id, r.target_type
            ORDER BY report_count DESC";

    $stmt = $pdo->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Приводим типы к числам для JS
    foreach ($results as &$row) {
        $row['report_count'] = (int)$row['report_count'];
        $row['is_paid'] = (int)($row['is_paid'] ?? 0);
        $row['is_active'] = (int)($row['is_active'] ?? 1);
        $row['name_reset'] = (int)($row['name_reset'] ?? 0);
    }

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}