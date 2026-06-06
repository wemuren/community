<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/vendor/autoload.php';

function sendVerificationCode(string $toEmail, string $code): bool {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.timeweb.ru';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'noreply@community-it.ru';
        $mail->Password   = getEnvConfigValue('MAIL_PASSWORD', '');
        $mail->SMTPSecure = 'ssl';
        $mail->Port       = 465;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom('noreply@community-it.ru', 'COMMUNITY');
        $mail->addAddress($toEmail);

        $mail->isHTML(true);
        $mail->Subject = 'Код подтверждения — COMMUNITY';
        $mail->Body    = "
            <div style='font-family:sans-serif;max-width:400px;margin:0 auto'>
                <h2 style='color:#1a1a1a'>Ваш код подтверждения</h2>
                <p style='font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1a1a'>{$code}</p>
                <p style='color:#666'>Код действителен 10 минут. Никому его не сообщайте.</p>
            </div>
        ";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log('Mailer error: ' . $mail->ErrorInfo);
        return false;
    }
}