<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/vendor/autoload.php';
$keys=\Minishlink\WebPush\VAPID::createVapidKeys();
echo "VAPID public: ".$keys['publicKey'].PHP_EOL;
echo "VAPID private: ".$keys['privateKey'].PHP_EOL;
echo "Keep the private key secret; insert both keys into server/settings.php.".PHP_EOL;
