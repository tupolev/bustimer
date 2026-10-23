<?php
// Copy to settings.php; keep private and NEVER commit VAPID_PRIVATE or CRON_SECRET.
return [
 'db_path'=>'/home/YOUR_ACCOUNT/private/bustimer-alarms.sqlite',
 'vapid_subject'=>'mailto:admin@example.org',
 'vapid_public'=>'REPLACE_WITH_VAPID_PUBLIC_KEY',
 'vapid_private'=>'REPLACE_WITH_VAPID_PRIVATE_KEY',
 'origin'=>'https://tupolev.github.io',
 'api_source'=>'https://api.transitous.org',
];
