/* Offline support. The page itself is fetched fresh from the network whenever there is a signal (so an update shows on the
   next open), and the saved copy is used only when the network fails. Other files are served from the phone and refreshed in the
   background. Every network fetch skips the browser's own HTTP cache, so an old copy is never saved as the new one. */
const CACHE='taxi-nippo-6e21fa30df';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','leaflet.js','leaflet.css'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('taxi-nippo-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const fresh=r=>fetch(new Request(r,{cache:'no-cache'}));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  const page=r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('/index.html');
  e.respondWith(caches.open(CACHE).then(async c=>{
    if(page){
      try{const res=await Promise.race([fresh(r),new Promise((_,no)=>setTimeout(no,4000))]);if(res&&res.ok){c.put(r,res.clone());return res}}catch(x){}
      return (await c.match(r,{ignoreSearch:true}))||(await c.match('index.html'))||fetch(r);
    }
    const hit=await c.match(r,{ignoreSearch:true});
    const net=fresh(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>hit);
    return hit||net;
  }));
});
