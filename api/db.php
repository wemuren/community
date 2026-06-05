<?php
ini_set('error_log', __DIR__ . '/server_errors.log');
ini_set('log_errors', '1');

function getEnvConfigValue(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }

    static $fileConfig = null;

    if ($fileConfig === null) {
        $fileConfig = [];
        $envPath = dirname(__DIR__) . '/.env';

        if (is_readable($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
                [$envKey, $envValue] = explode('=', $line, 2);
                $envKey   = trim($envKey);
                $envValue = trim($envValue);
                if (
                    (str_starts_with($envValue, '"') && str_ends_with($envValue, '"')) ||
                    (str_starts_with($envValue, "'") && str_ends_with($envValue, "'"))
                ) {
                    $envValue = substr($envValue, 1, -1);
                }
                $fileConfig[$envKey] = $envValue;
            }
        }
    }

    return $fileConfig[$key] ?? $default;
}

$host    = getEnvConfigValue('DB_HOST',     '127.0.0.1');
$port    = getEnvConfigValue('DB_PORT',     '3306');
$db      = getEnvConfigValue('DB_NAME',     'community');
$user    = getEnvConfigValue('DB_USER',     'root');
$pass    = getEnvConfigValue('DB_PASSWORD', '');
$charset = getEnvConfigValue('DB_CHARSET',  'utf8mb4');
$socket  = getEnvConfigValue('DB_SOCKET',   '');

// Если задан сокет — используем его, иначе host:port
$dsn = $socket
    ? "mysql:unix_socket={$socket};dbname={$db};charset={$charset}"
    : "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}