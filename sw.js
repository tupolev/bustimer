const CACHE="bustimer-shell-v35";const SHELL=["./icon.svg","./manifest.webmanifest","./countries.json"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 // Never serve an old HTML page from the app-shell cache: deployed design changes must be visible.
 if(request.mode==="navigate"||new URL(request.url).pathname.endsWith("/index.html")){
  event.respondWith(fetch(request,{cache:"no-store"}).catch(()=>new Response("BusTimer requires a connection to load the latest version.",{status:503,headers:{"Content-Type":"text/plain;charset=utf-8"}})));
  return;
 }
 event.respondWith(fetch(request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}
  return response;
 }).catch(()=>caches.match(request)));
});
self.addEventListener("push",event=>{
 let data={};try{data=event.data?.json()||{}}catch{}
 event.waitUntil(self.registration.showNotification(data.title||"BusTimer",{body:data.body||"Departure reminder",icon:"./icon.svg",tag:"bustimer-push"}));
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();
 event.waitUntil(clients.openWindow(self.registration.scope));
});
