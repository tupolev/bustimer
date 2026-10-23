<?php
declare(strict_types=1);
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
require __DIR__.'/vendor/autoload.php';
$cfg=require __DIR__.'/bootstrap.php';
function db():PDO{global $cfg;static $db=null;if($db)return $db;$path=$cfg['db_path'];$dir=dirname($path);if(!is_dir($dir))mkdir($dir,0700,true);$db=new PDO('sqlite:'.$path,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);$db->exec('PRAGMA busy_timeout=5000');$db->exec('CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, subscription TEXT NOT NULL, created_at INTEGER NOT NULL)');$db->exec('CREATE TABLE IF NOT EXISTS alarms(device_id TEXT NOT NULL, favorite_id TEXT NOT NULL, city TEXT NOT NULL, stop_id TEXT NOT NULL, line TEXT NOT NULL, mode TEXT NOT NULL, direction TEXT NOT NULL, lead_minutes INTEGER NOT NULL, once_only INTEGER NOT NULL, last_departure TEXT NOT NULL DEFAULT "", last_notified TEXT NOT NULL DEFAULT "", created_at INTEGER NOT NULL, PRIMARY KEY(device_id,favorite_id))');return $db;}
function respond(int $status,array $data):never{http_response_code($status);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
function payload():array{$raw=file_get_contents('php://input');if(strlen($raw)>20000)respond(413,['error'=>'Too large']);$data=json_decode($raw,true);if(!is_array($data))respond(400,['error'=>'Invalid JSON']);return $data;}
function token():string{return (string)($_SERVER['HTTP_X_BUSTIMER_TOKEN']??'');}
function authorized(string $device):bool{$q=db()->prepare('SELECT token_hash FROM devices WHERE id=?');$q->execute([$device]);$hash=$q->fetchColumn();return is_string($hash)&&hash_equals($hash,hash('sha256',token()));}
function pushClient():WebPush{global $cfg;return new WebPush(['VAPID'=>['subject'=>$cfg['vapid_subject'],'publicKey'=>$cfg['vapid_public'],'privateKey'=>$cfg['vapid_private']]]);}
function validText(mixed $value,int $max=180):string{if(!is_string($value)||strlen($value)>$max||trim($value)==='')respond(400,['error'=>'Invalid field']);return $value;}
