<?php
declare(strict_types=1);
require __DIR__.'/lib.php';
$origin=$_SERVER['HTTP_ORIGIN']??'';
header('Vary: Origin');
if($origin===$cfg['origin']){header('Access-Control-Allow-Origin: '.$origin);header('Access-Control-Allow-Headers: Content-Type, X-BusTimer-Token');header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');}
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code($origin===$cfg['origin']?204:403);exit;}
if($origin!==''&&$origin!==$cfg['origin'])respond(403,['error'=>'Forbidden origin']);
$action=$_GET['action']??'';
$method=$_SERVER['REQUEST_METHOD']??'GET';
if($action==='config'&&$method==='GET')respond(200,['enabled'=>true,'publicKey'=>$cfg['vapid_public'],'version'=>1]);
if($action==='subscribe'&&$method==='POST'){
 $p=payload();$sub=$p['subscription']??null;
 if(!is_array($sub)||!is_array($sub['keys']??null)||!is_string($sub['endpoint']??null))respond(400,['error'=>'Invalid subscription']);
 $url=parse_url($sub['endpoint']);if(($url['scheme']??'')!=='https'||empty($url['host'])||strlen($sub['endpoint'])>2000)respond(400,['error'=>'Invalid push endpoint']);
 foreach(['auth','p256dh'] as $key)if(!is_string($sub['keys'][$key]??null)||strlen($sub['keys'][$key])>400)respond(400,['error'=>'Invalid push keys']);
 $device=bin2hex(random_bytes(16));$secret=bin2hex(random_bytes(32));
 db()->prepare('INSERT INTO devices(id,token_hash,subscription,created_at) VALUES (?,?,?,?)')->execute([$device,hash('sha256',$secret),json_encode($sub),time()]);
 respond(201,['deviceId'=>$device,'token'=>$secret]);
}
$device=validText($_SERVER['HTTP_X_BUSTIMER_DEVICE']??'',80);
if(!authorized($device))respond(401,['error'=>'Unauthorized']);
if($action==='alarm'&&$method==='PUT'){
 $p=payload();$favorite=validText($p['favoriteId']??null,128);$city=validText($p['city']??null,40);$stop=validText($p['stopId']??null,400);$line=validText($p['line']??null,80);
 $mode=validText($p['mode']??null,40);$direction=is_string($p['direction']??null)?substr($p['direction'],0,160):'';
 $lead=$p['minutes']??null;$once=$p['once']??null;
 if(!is_int($lead)||!in_array($lead,[2,5,10,15,20,30,45,60],true)||!is_bool($once))respond(400,['error'=>'Invalid alarm']);
 if(!in_array($city,['germany','spain','france','portugal','netherlands','austria','switzerland','italy','czechia','poland','denmark','sweden'],true))respond(422,['error'=>'This source is not yet supported for server alarms']);
 $q=db()->prepare('INSERT INTO alarms(device_id,favorite_id,city,stop_id,line,mode,direction,lead_minutes,once_only,created_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(device_id,favorite_id) DO UPDATE SET city=excluded.city,stop_id=excluded.stop_id,line=excluded.line,mode=excluded.mode,direction=excluded.direction,lead_minutes=excluded.lead_minutes,once_only=excluded.once_only,last_departure="",last_notified=""');
 $q->execute([$device,$favorite,$city,$stop,$line,$mode,$direction,$lead,$once?1:0,time()]);
 respond(200,['ok'=>true]);
}
if($action==='alarm'&&$method==='DELETE'){
 $favorite=validText($_GET['favoriteId']??null,128);
 db()->prepare('DELETE FROM alarms WHERE device_id=? AND favorite_id=?')->execute([$device,$favorite]);
 respond(200,['ok'=>true]);
}
if($action==='unsubscribe'&&$method==='DELETE'){
 db()->prepare('DELETE FROM alarms WHERE device_id=?')->execute([$device]);
 db()->prepare('DELETE FROM devices WHERE id=?')->execute([$device]);
 respond(200,['ok'=>true]);
}
respond(404,['error'=>'Not found']);
