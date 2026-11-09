const C="rate-v2";
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(["./","index.html","admin.html","css/style.css","js/app.js","js/admin.js","data/index.json","data/alias.json","icon.svg"])));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!="GET")return;
 e.respondWith(caches.open(C).then(async c=>{const m=await c.match(e.request);
  const n=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>m);return m||n}))});
