<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../db.php';
$data = json_decode(file_get_contents("php://input"));

if (empty($data->new_email) || empty($data->user_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Данные не полные"]);
    exit;
}

$new_email = strtolower(trim($data->new_email));
$u_id = (int)$data->user_id;

try {
    $check = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ? AND id != ?");
    $check->execute([$new_email, $u_id]);
    if ($check->fetch()) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email уже занят"]);
        exit;
    }

    // Сначала удаляем верификацию — иначе FK не даст обновить email
    $pdo->prepare("DELETE FROM email_verifications WHERE LOWER(email) = LOWER((SELECT email FROM users WHERE id = ?))")
        ->execute([$u_id]);

    $pdo->prepare("UPDATE users SET email = ? WHERE id = ?")
        ->execute([$new_email, $u_id]);

    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>