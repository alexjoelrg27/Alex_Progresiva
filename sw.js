const CACHE='ecoruta-v3';
const BASE=new URL('./',self.location.href);
const FILES=['./','./index.html','./view/styles.css','./view/view.js','./controller/app.js','./model/database.js','./model/catalog.js','./model/google.js','./model/maps-urls.js','./data/places.json','./data/places.csv','./data/places.xml','./vendor/jquery.min.js','./vendor/sql-wasm.js','./vendor/sql-wasm.wasm','./config.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(p=>new URL(p,BASE).href))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ecoruta-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type==='CACHE_STATUS')event.source?.postMessage({type:'CACHE_READY'});});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE.pathname))return;
 // Google maps and Firestore are never cached; local catalogue and shell are.
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).catch(()=>caches.match(new URL('./index.html',BASE).href)));return;
 }
 event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});
