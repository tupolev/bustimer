import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("PHP backend is deployable separately with private settings and no committed secrets",()=>{
 for(const p of ["server/api.php","server/lib.php","server/bootstrap.php","server/cron.php","server/settings.example.php","server/composer.json","server/.htaccess","server/README.md","server/generate-vapid.php"])assert.ok(existsSync(p),p);
 assert.ok(!existsSync("server/settings.php"));
 assert.match(read("server/.gitignore"),/settings.php/);
 assert.match(read("server/.htaccess"),/vendor/);
 assert.match(read("server/cron.php"),/PHP_SAPI/);
 assert.match(read("server/api.php"),/X-BusTimer-Token/);
 assert.match(read("server/api.php"),/X-BusTimer-Device/);
 assert.match(read("server/api.php"),/Access-Control-Allow-Origin/);
 assert.match(read("server/settings.example.php"),/api.transitous.org/);
});
test("PWA registers background push, cancels remote alarms, and falls back to local mode",()=>{
 const html=read("index.html"),sw=read("sw.js");
 assert.match(html,/bustimer.kodesoft.net\/server\/api.php/);
 assert.match(html,/registration.pushManager.subscribe/);
 assert.match(html,/s.departureAlarm.remote=await remoteAlarm\(s\)/);
 assert.match(html,/if\(!a\|\|a.remote/);
 assert.match(sw,/addEventListener\("push"/);
 assert.match(sw,/showNotification/);
 assert.match(sw,/addEventListener\("notificationclick"/);
});
