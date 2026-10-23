<?php
declare(strict_types=1);

/**
 * One-time anonymous Web Push provisioning on the production host.
 * Never prints private VAPID keys or writes credentials to the repository.
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
$root = realpath(dirname(__DIR__));
$expected = '/home/dh_ikhr5d/bustimer.kodesoft.net';
if ($root !== $expected) {
    fwrite(STDERR, "Refusing provisioning outside expected DreamHost directory.\n");
    exit(1);
}
$settingsPath = __DIR__ . '/settings.php';
if (file_exists($settingsPath)) {
    echo "Existing private settings preserved; no changes made.\n";
    exit;
}
foreach (['pdo_sqlite', 'openssl', 'curl', 'mbstring'] as $extension) {
    if (!extension_loaded($extension)) {
        fwrite(STDERR, "Missing required PHP extension: $extension\n");
        exit(1);
    }
}
if (PHP_VERSION_ID < 80200) {
    fwrite(STDERR, "PHP 8.2+ is required.\n");
    exit(1);
}
require __DIR__ . '/vendor/autoload.php';
$privateDir = '/home/dh_ikhr5d/bustimer-private';
if (!is_dir($privateDir) && !mkdir($privateDir, 0700, true) && !is_dir($privateDir)) {
    throw new RuntimeException('Cannot create private storage directory.');
}
chmod($privateDir, 0700);
$keys = \Minishlink\WebPush\VAPID::createVapidKeys();
$settings = [
    'db_path' => $privateDir . '/bustimer-alarms.sqlite',
    'vapid_subject' => 'https://bustimer.kodesoft.net/',
    'vapid_public' => $keys['publicKey'],
    'vapid_private' => $keys['privateKey'],
    'origin' => 'https://bustimer.kodesoft.net',
    'api_source' => 'https://api.transitous.org',
];
$tmp = tempnam(__DIR__, '.settings-');
if ($tmp === false) {
    throw new RuntimeException('Cannot create private settings file.');
}
chmod($tmp, 0600);
try {
    $contents = "<?php\nreturn " . var_export($settings, true) . ";\n";
    if (file_put_contents($tmp, $contents) !== strlen($contents)) {
        throw new RuntimeException('Failed to write settings.');
    }
    if (file_exists($settingsPath)) {
        throw new RuntimeException('Settings appeared concurrently; refusing overwrite.');
    }
    if (!rename($tmp, $settingsPath)) {
        throw new RuntimeException('Cannot install private settings.');
    }
} finally {
    if (is_file($tmp)) {
        unlink($tmp);
    }
}
chmod($settingsPath, 0600);
require __DIR__ . '/lib.php';
db();
$dbFile = $settings['db_path'];
if (is_file($dbFile)) {
    chmod($dbFile, 0600);
}
echo "Anonymous push settings and private SQLite initialized. No secrets printed.\n";
