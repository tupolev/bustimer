# BusTimer Push backend (PHP)

Target: **https://bustimer.kodesoft.net/server/api.php**. The PWA stays on **https://tupolev.github.io/bustimer/**. This is an opt-in, experimental Web Push feature; it does **not** require user accounts.

## Requirements
- HTTPS, PHP **8.2+**, SQLite (PDO_SQLITE), cURL, JSON, mbstring and OpenSSL
- PHP CLI for a cron job every minute, and outbound HTTPS requests
- Apache with .htaccess enabled **or equivalent Nginx hosting rules**
- Composer locally or on the host; the `vendor/` directory must be uploaded along with PHP files

## Installation

1. Upload the entire `server/` directory under the host's document root so `https://bustimer.kodesoft.net/server/api.php?action=config` is reachable.
2. From `server/`, run `composer install --no-dev --optimize-autoloader` (or run it locally and upload `vendor/`).
3. Generate **one** VAPID key pair with:
   `php -r 'require "vendor/autoload.php"; print_r(\\Minishlink\\WebPush\\VAPID::createVapidKeys());'`
   Put the resulting public/private strings into `settings.php`. Do not change them after users subscribe.
4. Copy `settings.example.php` to `settings.php`, fill the VAPID keys, a genuine contact email in `vapid_subject`, and an **absolute SQLite file path outside the public document root**. Set the origin to exactly `https://tupolev.github.io`.
5. Ensure the PHP user can write to the SQLite directory. Do **not** publicly expose the database, `settings.php`, `vendor/`, source files, error logs or Composer files. `.htaccess` protects Apache; **Nginx needs equivalent explicit deny rules**. The example path `/home/YOUR_ACCOUNT/private/` is a placeholder, not a production path.
6. Add a control-panel cron job at **one-minute frequency** (adapt path to your hosting):

   `* * * * * /usr/bin/php /home/YOUR_ACCOUNT/public_html/server/cron.php`

   Run the same command manually once to confirm it can initialize the database and contact Transitous. The cron is **CLI-only** and cannot be invoked as a public URL.
7. Open the config URL in your browser. It should return `enabled:true` with the **public** VAPID key only. Never return private settings.

## How alarm delivery works
- After explicit notification consent and clicking “Set alert,” the PWA requests a PushSubscription, registers it, then stores an individual favorite's country/stop ID, line, transport type, direction, lead minutes and once/repeat preference on the PHP backend.
- A random 256-bit bearer token authenticates each device; only its SHA-256 hash is stored on the server. The raw token is kept in the PWA browser's local storage. The bearer token must be treated as sensitive; XSS, clearing browser storage or reinstalling the PWA can invalidate management of existing subscriptions.
- The cron queries **Transitous** for active alarms and sends a VAPID Web Push notification for the next eligible departure. Successful single-use alarms are deleted; recurring alarms are deduplicated by the departure's scheduled timestamp.
- When remote setup fails, BusTimer retains the **local alarm fallback** (which needs the page active). Belgium and Luxembourg's special local GTFS data are not yet supported by the server's Transitous-only provider matcher. Push availability also varies by OS/browser. On iOS, add the app to the Home Screen and grant notifications.
- The phone's push provider accepts and later delivers messages; neither cron execution nor final OS delivery at the exact second is guaranteed. A one-minute cron means approximately one-minute scheduling precision plus network/OS delays.
- Remote alarms are cancelled when the user removes the alarm or its favorite while online. If the PHP server is unreachable during cancellation, the PWA retains the alarm so it can be retried rather than silently leaving a remote alarm behind.

## Security / operations
- Use a dedicated host subdomain with valid TLS. Do not store `settings.php`, live SQLite files, `vendor/` or credentials in GitHub. These files are ignored by Git.
- CORS permits only the published GitHub Pages origin. CORS is **not** authentication: bearer tokens authenticate modification. Consider firewall/WAF rate limits for the public subscription endpoint and monitor outgoing traffic.
- Back up the SQLite database in a private location. Deleting it drops all registrations and alarm state.
- Push endpoints are personal device identifiers. Retain subscriptions only as needed; users should be able to delete their device subscription. Currently the API has `DELETE ?action=unsubscribe` for that purpose.
- Check your hosting's outbound HTTP restrictions and PHP `disable_functions` configuration.
- Never place database files below a public URL, including in `server/private/`; the example uses an external private directory.

## Endpoint overview
- `GET /server/api.php?action=config` — VAPID public key
- `POST /server/api.php?action=subscribe` — creates device subscription and bearer credentials
- `PUT /server/api.php?action=alarm` — create/update one alarm (authenticated)
- `DELETE /server/api.php?action=alarm&favoriteId=...` — delete one alarm (authenticated)
- `DELETE /server/api.php?action=unsubscribe` — remove all alarms and the device subscription (authenticated)

Device-authenticated requests carry `X-BusTimer-Device` and `X-BusTimer-Token` headers.

## Limitations before production rollout
This is an initial implementation. Test with real Android/iOS/desktop push subscriptions and cron on your specific host; real-time provider fields vary by country. Provide subscription cleanup/expiration, better abuse prevention and end-to-end failure instrumentation before advertising guaranteed background alarms.
