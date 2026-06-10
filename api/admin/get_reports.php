<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'admin_auth.php';
checkAdmin($pdo, $_GET['admin_id'] ?? 0);

try {
    $sql = "SELECT 
                r.target_id, 
                r.target_type, 
                COUNT(*) as report_count,
                GROUP_CONCAT(r.reason SEPARATOR ' | ') as all_reasons,
                
                CASE 
                    WHEN r.target_type = 'video' THEN v.title
                    WHEN r.target_type = 'user' THEN u.full_name
                END as target_name,

                v.thumbnail as target_thumbnail,

                u.avatar as user_avatar,
                u.username as user_handle,
                u.banner as banner,
                u.is_paid as is_paid,
                u.is_active as is_active,
                u.created_at as created_at,
                u.name_reset as name_reset

            FROM reports r
            LEFT JOIN videos v ON (r.target_type = 'video' AND v.id = r.target_id)
            LEFT JOIN users u ON (
                (r.target_type = 'user' AND u.id = r.target_id) 
                OR 
                (r.target_type = 'video' AND u.id = v.user_id)
            )
            GROUP BY r.target_id, r.target_type, v.title, v.thumbnail, u.full_name, u.avatar, u.username, u.banner, u.is_paid, u.is_active, u.created_at, u.name_reset
            ORDER BY report_count DESC";

    $stmt = $pdo->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

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