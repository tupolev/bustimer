<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli') {http_response_code(404);exit;}
require __DIR__.'/lib.php';
$now=time();$sent=0;$errors=0;$matched=0;$feeds=[];
function departuresFor(string $stop):array{
 global $cfg,$feeds;
 if(isset($feeds[$stop]))return $feeds[$stop];
 $url=rtrim($cfg['api_source'],'/').'/api/v6/stoptimes?'.http_build_query(['stopId'=>$stop,'n'=>80]);
 $ch=curl_init($url);curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_TIMEOUT=>14,CURLOPT_CONNECTTIMEOUT=>7,CURLOPT_USERAGENT=>'BusTimerPush/0.1 (+https://github.com/tupolev/bustimer)',CURLOPT_HTTPHEADER=>['Accept: application/json']]);
 $raw=curl_exec($ch);$code=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
 if($raw===false||$code!==200)throw new RuntimeException('Upstream HTTP '.$code);
 $result=json_decode($raw,true);
 return $feeds[$stop]=is_array($result['stopTimes']??null)?$result['stopTimes']:[];
}
function normalizedMode(string $mode):string{
 $m=strtoupper($mode);
 if(in_array($m,['BUS','COACH','TROLLEYBUS'],true))return 'bus';
 if($m==='TRAM')return 'tram';
 if(in_array($m,['SUBWAY','METRO'],true))return 'subway';
 if($m==='SUBURBAN')return 'suburban';
 if($m==='FERRY')return 'ferry';
 if(str_contains($m,'REGIONAL'))return 'regional';
 if(str_contains($m,'HIGH')||str_contains($m,'LONG'))return 'nationalExpress';
 return 'other';
}
function departureKey(array $item):string{
 $place=$item['place']??[];
 return (string)($place['scheduledDeparture']??$place['scheduledArrival']??$place['departure']??$place['arrival']??'');
}
$records=db()->query('SELECT a.*,d.subscription FROM alarms a JOIN devices d ON d.id=a.device_id ORDER BY a.stop_id')->fetchAll(PDO::FETCH_ASSOC);
$push=pushClient();
foreach($records as $alarm){
 try{
  $best=null;$bestTime=PHP_INT_MAX;
  foreach(departuresFor($alarm['stop_id']) as $dep){
   if(!is_array($dep)||($dep['cancelled']??false)||($dep['tripCancelled']??false))continue;
   $line=(string)($dep['routeShortName']?:($dep['displayName']?:($dep['routeLongName']??'')));
   if($line!==$alarm['line'])continue;
   if(normalizedMode((string)($dep['mode']??''))!==$alarm['mode'])continue;
   $direction=(string)($dep['headsign']??'');
   if($alarm['direction']!==''&&$direction!==$alarm['direction'])continue;
   $place=$dep['place']??[];
   $time=strtotime((string)($place['departure']??$place['arrival']??$place['scheduledDeparture']??$place['scheduledArrival']??''));
   if($time===false||$time<$now||$time>$now+(int)$alarm['lead_minutes']*60||$time>=$bestTime)continue;
   $best=$dep;$bestTime=$time;
  }
  if(!$best)continue;
  ++$matched;
  $key=departureKey($best);
  if(!$key||$alarm['last_notified']===$key)continue;
  $remaining=max(0,(int)ceil(($bestTime-$now)/60));
  $message=json_encode(['title'=>'BusTimer · '.$alarm['line'],'body'=>($alarm['direction']?:$alarm['line']).' · '.$remaining.' min','url'=>rtrim($cfg['origin'],'/').'/'],JSON_UNESCAPED_UNICODE);
  $sub=Subscription::create(json_decode($alarm['subscription'],true));
  $report=$push->sendOneNotification($sub,$message);
  if(!$report->isSuccess()){++$errors;error_log('BusTimer push delivery failed: '.$report->getReason());continue;}
  if((int)$alarm['once_only']===1){$q=db()->prepare('DELETE FROM alarms WHERE device_id=? AND favorite_id=?');$q->execute([$alarm['device_id'],$alarm['favorite_id']]);}
  else{$q=db()->prepare('UPDATE alarms SET last_notified=? WHERE device_id=? AND favorite_id=?');$q->execute([$key,$alarm['device_id'],$alarm['favorite_id']]);}
  ++$sent;
 }catch(Throwable $e){++$errors;error_log('BusTimer alarm error: '.$e->getMessage());}
}
echo "BusTimer cron: sent=$sent errors=$errors matched=$matched alarms=".count($records)."\n";
