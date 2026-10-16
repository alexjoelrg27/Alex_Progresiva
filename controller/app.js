import {LocalDatabase} from '../model/database.js';
import {Catalog,normalize} from '../model/catalog.js';
import {View} from '../view/view.js';
import {showGoogleMap} from '../model/google.js';
const db=new LocalDatabase(),view=new View(),config=window.ECORUTA_CONFIG||{},catalog=new Catalog(db,config);
let places=[],favorites=[],category='Todos',query='',detailId=null,installPrompt=null,ready=false;
const render=()=>view.render(places,favorites,category,query);
function findPlace(id){return places.find(p=>p.id===id)||favorites.find(f=>f.id===id)?.place;}
function showDetail(id){const p=findPlace(id);if(!p)return;detailId=id;view.detail(p,favorites.find(f=>f.id===id));const dialog=document.querySelector('#place-dialog');if(!dialog.open)dialog.showModal();}
async function toggleFavorite(id){
 if(!ready)throw new Error('El almacenamiento todavía no está disponible.');
 const existing=favorites.find(f=>f.id===id);
 if(existing){await db.removeFavorite(id);favorites=favorites.filter(f=>f.id!==id);}
 else{const place=findPlace(id);if(!place)return;const record={id,place,note:'',visited:false,savedAt:new Date().toISOString()};await db.saveFavorite(record);favorites.push(record);}
 render();if(document.querySelector('#place-dialog').open&&detailId===id)showDetail(id);
 view.toast(existing?'Lugar eliminado de tu ruta.':'Guardado en tu ruta. Disponible sin conexión.');
}
function guarded(fn){return async function(...args){try{await fn.apply(this,args);}catch(error){view.toast(error.message||'No se pudo completar la acción.');}};}
async function openMap(items){
 const dialog=document.querySelector('#map-dialog');if(!dialog.open)dialog.showModal();$('#map-status').text('Conectando con Google Maps…');$('#map').empty();
 try{await showGoogleMap(config,items,document.querySelector('#map'));$('#map-status').text('Selecciona un marcador para ver el lugar.');}
 catch(e){$('#map-status').text(e.message);}
}
function navigate(page){view.page(page);history.replaceState(null,'',`#${page}`);}
$(document).ready(async()=>{
 $('[data-page="explore"]').attr('aria-current','page');
 $(document).on('click','[data-page]',function(){navigate(this.dataset.page);});
 $(document).on('click','[data-favorite]',guarded(async function(){await toggleFavorite(this.dataset.favorite);}));
 $(document).on('click','[data-detail]',function(){showDetail(this.dataset.detail);});
 $(document).on('click','[data-reset]',()=>{category='Todos';query='';$('#search').val('');$('.chip').removeClass('selected').attr('aria-pressed','false');$('.chip').first().addClass('selected').attr('aria-pressed','true');render();navigate('explore');});
 $('.chip').on('click',function(){category=this.dataset.category;$('.chip').removeClass('selected').attr('aria-pressed','false');$(this).addClass('selected').attr('aria-pressed','true');render();});
 $('#search').on('input',function(){query=this.value;render();});
 $('.dialog-close').on('click',function(){this.closest('dialog').close();});
 $('dialog').on('click',function(e){if(e.target!==this)return;const r=this.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.close();});
 $(document).on('click','[data-map]',function(){openMap([findPlace(this.dataset.map)]);});
 $('#show-map').on('click',()=>openMap(places));
 $(document).on('click','#save-note',guarded(async function(){
  const old=favorites.find(f=>f.id===this.dataset.id);if(!old)return;
  const next={...old,note:$('#note').val().trim(),visited:$('#visited').prop('checked')};
  await db.saveFavorite(next);favorites=favorites.map(f=>f.id===next.id?next:f);render();view.toast('Nota y visita guardadas en este dispositivo.');
 }));
 $('#offline-help').on('click',function(){$('#offline-details').stop(true,true).slideToggle(200);$(this).attr('aria-expanded',String($(this).attr('aria-expanded')!=='true'));});
 $('#architecture').on('click',function(){$('#architecture-detail').stop(true,true).slideToggle(200);$(this).attr('aria-expanded',String($(this).attr('aria-expanded')!=='true'));});
 $('#load-source').on('click',guarded(async function(){
  if(!ready)throw new Error('No está disponible el almacenamiento local.');
  $(this).prop('disabled',true);$('#source-status').text('Leyendo catálogo…');
  try{const source=$('#source').val();const next=await catalog.load(source);places=next;render();$('#source-status').text(`Fuente actual: ${source.toUpperCase()} · ${places.length} lugares validados`);$('#sql-preview').prop('hidden',source!=='sqlite');view.toast('Catálogo actualizado.');}
  catch(e){$('#source-status').text(e.message+' Se conserva el catálogo anterior.');}
  finally{$(this).prop('disabled',false);}
 }));
 $('#export-route').on('click',()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify({app:'EcoRuta',exportedAt:new Date().toISOString(),favorites},null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='mi-ruta-ecoruta.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);view.toast('Ruta exportada con tus notas.');
 });
 $('#install').on('click',guarded(async()=>{
  if(installPrompt){await installPrompt.prompt();const choice=await installPrompt.userChoice;if(choice.outcome==='accepted')$('#install').text('App instalada ✓');installPrompt=null;}
  else view.toast(matchMedia('(display-mode: standalone)').matches?'EcoRuta ya está abierta como aplicación.':'En Chrome: menú → Instalar EcoRuta. En iPhone: Compartir → Añadir a pantalla de inicio.');
 }));
 function network(){const online=navigator.onLine;$('#connection').text(online?'● En línea':'○ Sin conexión').css('color',online?'#537747':'#9b6724');}
 $(window).on('online offline',network);network();
 $('#google-status').text(`Google Maps: ${config.googleMapsApiKey?'clave configurada (pendiente de validar)':'pendiente de configurar'} · Firestore: ${config.firestoreProjectId?'proyecto configurado (pendiente de validar)':'pendiente de configurar'}`);
 try{
  await db.open();ready=true;favorites=await db.all('favorites');
  $('#db-status').text('IndexedDB activo · favoritos y notas guardados en el dispositivo.');
  try{places=await catalog.load('json');}
  catch(e){places=normalize(await db.all('catalog'));$('#source-status').text('Catálogo recuperado desde IndexedDB.');}
  render();
 }catch(e){
  $('#db-status').text('No se pudo abrir IndexedDB. Revisa los permisos de almacenamiento.');
  $('#catalog-grid').attr('aria-busy','false').html('<div class="empty"><h3>No pudimos cargar los lugares</h3><p>Permite el almacenamiento del navegador y vuelve a abrir la app con conexión.</p></div>');view.toast(e.message);
 }
 const page=location.hash.slice(1);if(['explore','saved','sources'].includes(page))navigate(page);
});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#install').text('Instalar app ↗');});
window.addEventListener('appinstalled',()=>{$('#install').text('App instalada ✓');installPrompt=null;});
if('serviceWorker' in navigator){
 navigator.serviceWorker.register('./sw.js').then(async registration=>{
  await navigator.serviceWorker.ready;
  const worker=registration.active;
  if(worker){worker.postMessage({type:'CACHE_STATUS'});}
 }).catch(()=>$('#sw-status').text('No se pudo preparar el modo offline. Usa HTTPS o localhost y vuelve a cargar.'));
 navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='CACHE_READY')$('#sw-status').text('Archivos descargados · la app está lista para abrir sin conexión.');});
}else $('#sw-status').text('Este navegador no permite Service Workers.');
