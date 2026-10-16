import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {normalize,parseCSV,Catalog} from '../model/catalog.js';
import {mapsDirectionsURL,mapsSearchURL,mapsEmbedURL} from '../model/maps-urls.js';
import {escapeHTML} from '../view/view.js';
const root=new URL('../',import.meta.url);
const json=JSON.parse(await readFile(new URL('data/places.json',root),'utf8'));
const csv=await readFile(new URL('data/places.csv',root),'utf8');
assert.deepEqual(normalize(parseCSV(csv)),normalize(json));
assert.equal(parseCSV('a,b\r\n"hola, mundo","dice ""sí"""\r\n')[0].b,'dice "sí"');
assert.throws(()=>normalize([...json,json[0]]));
assert.throws(()=>normalize([{...json[0],lat:91}]));
assert.throws(()=>normalize([{...json[0],duration:''}]));
assert.equal(escapeHTML('<script>"&'), '&lt;script&gt;&quot;&amp;');
const require=createRequire(import.meta.url);
const initSqlJs=require('../vendor/sql-wasm.js');
const originalFetch=globalThis.fetch;
globalThis.window={initSqlJs};
globalThis.fetch=async path=>({ok:true,json:async()=>JSON.parse(await readFile(new URL(path,root),'utf8'))});
// Exercise the actual SQLite provider, with the real WASM engine.
window.initSqlJs=()=>initSqlJs({locateFile:file=>fileURLToPath(new URL('vendor/'+file,root))});
let cached;
const catalog=new Catalog({cacheCatalog:async value=>{cached=value;}},{});
const result=await catalog.load('sqlite');
assert.equal(result.length,6);
assert.deepEqual(new Set(result.map(p=>p.id)),new Set(json.map(p=>p.id)));
assert.deepEqual(cached,result);
await assert.rejects(()=>catalog.load('firestore'),/Configura/);
globalThis.fetch=originalFetch;
const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',root),'utf8'));
for(const icon of manifest.icons)await access(new URL(icon.src,root));
const worker=await readFile(new URL('sw.js',root),'utf8');
const files=worker.match(/const FILES=\[([\s\S]*?)\];/)[1];
for(const [,file]of files.matchAll(/'([^']+)'/g))await access(new URL(file,root));
console.log('PASS: equivalencia JSON/CSV, CSV con comillas, validación, escape HTML, proveedor SQLite/WASM, Firestore sin configuración y recursos PWA.');

for(const p of json){
 const search=new URL(mapsSearchURL(p));assert.equal(search.origin,'https://www.google.com');assert.equal(search.searchParams.get('api'),'1');assert.equal(search.searchParams.get('query'),`${p.lat},${p.lng}`);
 for(const mode of ['walking','driving','bicycling','transit']){const url=new URL(mapsDirectionsURL(p,mode));assert.equal(url.searchParams.get('destination'),`${p.lat},${p.lng}`);assert.equal(url.searchParams.get('travelmode'),mode);assert.equal(url.searchParams.get('api'),'1');}
 assert.equal(new URL(mapsEmbedURL(p)).searchParams.get('output'),'embed');
}
assert.throws(()=>mapsDirectionsURL(json[0],'invalid'));
assert.throws(()=>mapsEmbedURL({...json[0],lat:100}));
console.log('PASS: destinos y modos de viaje de Google Maps, vista incrustada y coordenadas inválidas.');
