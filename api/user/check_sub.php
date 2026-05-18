<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once '../db.php';

$f_id = (int)$_GET['follower_id'];
$t_id = (int)$_GET['followed_id'];

$sql = "SELECT id FROM subscriptions WHERE follower_id = ? AND followed_id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$f_id, $t_id]);

echo json_encode(["isSubscribed" => (bool)$stmt->fetch()]);