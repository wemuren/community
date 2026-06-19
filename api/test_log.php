<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$logPath = __DIR__ . '/server_errors.log';
ini_set('error_log', $logPath);
ini_set('log_errors', '1');

$timestamp = date('d-M-Y H:i:s T');
error_log("[$timestamp] PHP Warning: This is a test warning logged via test_log.php");
error_log("[$timestamp] Community Error: Sample critical error message for testing logs");

echo json_encode([
    "status" => "success",
    "message" => "Тестовые ошибки успешно записаны в лог-файл",
    "log_file" => $logPath
]);
