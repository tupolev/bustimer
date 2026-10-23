# BusTimer Push backend (PHP)

Target: **https://bustimer.kodesoft.net/server/api.php**. The PWA and API are served from the same production origin **https://bustimer.kodesoft.net/**. This is an opt-in, experimental Web Push feature; it does **not** require user accounts.

## Requirements
- HTTPS, PHP **8.2+**, SQLite (PDO_SQLITE), cURL, JSON, mbstring and OpenSSL
- PHP CLI for a cron job every minute, and outbound HTTPS requests
- Apache with .htaccess enabled **or equivalent Nginx hosting rules**
- Composer locally or on the host; the `vendor/` directory must be uploaded along with PHP files

## Installation

1. Upload the entire `server/` directory under the host's document root so `https://bustimer.kodesoft.net/server/api.php?action=config` is reachable.
2. From `server/`, run `composer install --no-dev --optimize-autoloader` (or run it locally and upload `vendor/`).
3. Generate **one** VAPID key pair using `php generate-vapid.php` from the `server/` directory. Keep the private output secret and do not regenerate keys after users subscribe.
4. Copy `settings.example.php` to `settings.php`, fill the VAPID keys, a genuine contact email in `vapid_subject`, and an **absolute SQLite file path outside the public document root**. Set the origin to exactly `https://bustimer.kodesoft.net`.
5. Ensure the PHP user can write to the SQLite directory. Do **not** publicly expose the database, `settings.php`, `vendor/`, source files, error logs or Composer files. `.htaccess` protects Apache; **Nginx needs equivalent explicit deny rules**. The example path `/home/YOUR_ACCOUNT/private/` is a placeholder, not a production path.
6. Add a control-panel cron job at **one-minute frequency** (adapt path to your hosting):

   `* * * * * /usr/bin/php /home/dh_ikhr5d/bustimer.kodesoft.net/server/cron.php`

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
- Use a dedicated host subdomain with valid TLS. Do not store `settings.php`, live SQLite files or credentials in GitHub. The deployment builds and uploads `vendor/` as a runtime dependency. These files are ignored by Git.
- CORS permits only the configured production origin. CORS is **not** authentication: bearer tokens authenticate modification. Consider firewall/WAF rate limits for the public subscription endpoint and monitor outgoing traffic.
- Back up the SQLite database in a private location. Deleting it drops all registrations and alarm state.
- Push endpoints are personal device identifiers. Retain subscriptions only as needed; users should be able to delete their device subscription. Currently the API has `DELETE ?action=unsubscribe` for that purpose.
- Check your hosting's outbound HTTP restrictions and PHP `disable_functions` configuration.
- Never place database files below a public URL, including in `server/private/`; the example uses an external private directory.

## Endpoint overview
- `GET /server/api.php?action=config` — VAPID public key
- `POST /server/api.php?action=subscribe` — creates device subscription and bearer credentials
- `GET /server/api.php?action=alarms` — list the current device's active alarm IDs (authenticated)
- `PUT /server/api.php?action=alarm` — create/update one alarm (authenticated)
- `DELETE /server/api.php?action=alarm&favoriteId=...` — delete one alarm (authenticated)
- `DELETE /server/api.php?action=unsubscribe` — remove all alarms and the device subscription (authenticated)

Device-authenticated requests carry `X-BusTimer-Device` and `X-BusTimer-Token` headers.

## Limitations before production rollout
This is an initial implementation. Test with real Android/iOS/desktop push subscriptions and cron on your specific host; real-time provider fields vary by country. Provide subscription cleanup/expiration, better abuse prevention and end-to-end failure instrumentation before advertising guaranteed background alarms.

Note: the subscription endpoint permits only known Apple, Mozilla, Google FCM and Microsoft push-service hosts to limit outbound-request abuse. Expand that list carefully only if a supported browser uses another verified endpoint.

## DreamHost production deployment

The workflow [deploy-dreamhost.yml](../.github/workflows/deploy-dreamhost.yml) is **manual** (Actions → Deploy BusTimer to DreamHost → Run workflow), uses the environment `dreamhost-production`, and never deletes files at the destination. Prepare production before its first run:

1. Use a dedicated DreamHost SSH password for the account `dh_ikhr5d` and confirm that password authentication is enabled on the host. Never paste the password into issues, commits or chat.
2. Verify the server's SSH host key **out of band** via DreamHost. `ssh-keyscan -H bustimer.kodesoft.net` collects host key lines but does **not** authenticate them; compare fingerprints before trusting.
3. In GitHub repository **Settings → Environments → dreamhost-production**, add Environment secrets:
   - `DREAMHOST_SSH_PASSWORD`: your DreamHost SSH password
   - `DREAMHOST_KNOWN_HOSTS`: verified known_hosts line(s) for `bustimer.kodesoft.net`
   - `DREAMHOST_SSH_HOST`: `bustimer.kodesoft.net`
   - `DREAMHOST_SSH_USER`: `dh_ikhr5d`
   - `DREAMHOST_WEB_ROOT`: `/home/dh_ikhr5d/bustimer.kodesoft.net/`
4. GitHub Actions uses `sshpass -e` and the protected `SSHPASS` environment variable to authenticate without displaying the password in commands. SSH host-key checking remains enabled. Key-based authentication is preferable long term.
5. Ensure that the domain serves that exact directory with HTTPS, that PHP CLI **and web PHP** are at least 8.2 with `pdo_sqlite`, `curl`, `openssl`, and `mbstring`, and Apache honors `.htaccess`. If SSH defaults to an old PHP but a modern binary exists, arrange an explicit binary in the workflow and cron rather than bypassing the check.
6. Store `settings.php` only on DreamHost in `/home/dh_ikhr5d/bustimer.kodesoft.net/server/settings.php`. Create its database directory outside the document root, e.g. `/home/dh_ikhr5d/bustimer-private/` with owner-only permissions. Run VAPID generation privately. Preserve keys and SQLite across releases.
7. After deployment check `/server/api.php?action=config` returns `enabled:true` and only the public key; ensure `/server/cron.php`, `/server/settings.php`, `/server/lib.php` and `/server/vendor/autoload.php` cannot be read over HTTP. Schedule the minute cron only after manual CLI validation. The workflow does not create the server-side cron, secrets, or VAPID keys.

**Note:** If the server has an existing site, back it up before first deployment. Rsync does not use `--delete`; unmatched old files will remain. The workflow's HTTP smoke check confirms reachability, not functional Web Push delivery.
