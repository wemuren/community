<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");
require_once '../db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->follower_id) && !empty($data->followed_id)) {
    $f_id = (int)$data->follower_id;
    $t_id = (int)$data->followed_id;

    if ($f_id === $t_id) {
        echo json_encode(["status" => "error", "message" => "Нельзя подписаться на самого себя"]);
        exit;
    }

    // Проверяем, есть ли уже подписка
    $check = $pdo->prepare("SELECT id FROM subscriptions WHERE follower_id = ? AND followed_id = ?");
    $check->execute([$f_id, $t_id]);
    
    if ($check->fetch()) {
        // Если есть — удаляем (отписка)
        $del = $pdo->prepare("DELETE FROM subscriptions WHERE follower_id = ? AND followed_id = ?");
        $del->execute([$f_id, $t_id]);
        echo json_encode(["status" => "unsubscribed"]);
    } else {
        // Если нет — добавляем (подписка)
        $ins = $pdo->prepare("INSERT INTO subscriptions (follower_id, followed_id) VALUES (?, ?)");
        $ins->execute([$f_id, $t_id]);
        echo json_encode(["status" => "subscribed"]);
    }
}