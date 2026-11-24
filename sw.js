// Keeps a copy of the app so it opens without a connection.
// The network is always tried first, so a new build shows as soon as there is one; the kept copy is only for when there is no connection.
const KEEP="reel8-v1";
self.addEventListener("install",e=>{self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==KEEP).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET"||new URL(r.url).origin!==self.location.origin) return;
  e.respondWith(
    fetch(r).then(res=>{
      if(res&&res.ok){const copy=res.clone();caches.open(KEEP).then(c=>c.put(r,copy)).catch(()=>{});}
      return res;
    }).catch(()=>caches.match(r,{ignoreSearch:true}).then(hit=>hit||(r.mode==="navigate"?caches.match("./",{ignoreSearch:true}).then(h=>h||caches.match("index.html")):undefined)).then(hit=>hit||Response.error()))
  );
});
