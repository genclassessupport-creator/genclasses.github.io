const C='bodhi-pen-v3';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url),cdn=u.hostname==='cdnjs.cloudflare.com';
  if(!cdn&&u.origin!==location.origin)return;
  if(cdn)e.respondWith(caches.open(C).then(c=>c.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok)c.put(r,x.clone());return x}))));
  else e.respondWith(fetch(r).then(x=>{if(x.ok){const cp=x.clone();caches.open(C).then(c=>c.put(r,cp))}return x}).catch(()=>caches.match(r,{ignoreSearch:true})));
});
