<?php
function sendVerificationCode(string $toEmail, string $code): bool {
    $apiKey = getEnvConfigValue('RESEND_API_KEY', '');

    $body = json_encode([
        'from'    => 'COMMUNITY <noreply@community-it.ru>',
        'to'      => [$toEmail],
        'subject' => 'Код подтверждения — COMMUNITY',
        'html'    => "
            <div style='font-family:sans-serif;max-width:400px;margin:0 auto'>
                <h2 style='color:#1a1a1a'>Ваш код подтверждения</h2>
                <p style='font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1a1a'>{$code}</p>
                <p style='color:#666'>Код действителен 10 минут. Никому его не сообщайте.</p>
            </div>
        "
    ]);

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 && $httpCode !== 201) {
        error_log('Resend error: ' . $response);
        return false;
    }

    return true;
}