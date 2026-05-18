<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $stmt = $pdo->prepare("UPDATE users SET name_reset = 0 WHERE id = ?");
    $stmt->execute([$data->id]);
    echo json_encode(["status" => "success"]);
}