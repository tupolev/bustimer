<?php
declare(strict_types=1);
// Copy settings.example.php to settings.php on the host; do not commit secrets.
$local=__DIR__.'/settings.php';
if(!is_file($local))throw new RuntimeException('Missing server/settings.php');
$settings=require $local;
if(!is_array($settings))throw new RuntimeException('Invalid settings');
return $settings;
