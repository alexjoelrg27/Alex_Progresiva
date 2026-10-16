import {mapsEmbedURL} from './maps-urls.js';
let loading;
async function showJavaScriptMap(config,places,element){
 if(!navigator.onLine)throw new Error('El mapa necesita internet. Los lugares y tus notas siguen disponibles sin conexión.');

 if(!loading){
  loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   const timer=setTimeout(()=>{script.remove();loading=undefined;reject(new Error('Google Maps tardó demasiado.'));},10000);
   window.ecorutaMapReady=()=>{clearTimeout(timer);resolve();};
   window.gm_authFailure=()=>{clearTimeout(timer);script.remove();loading=undefined;reject(new Error('Google Maps no autorizó la clave. Revisa la API, la facturación y los dominios permitidos.'));};
   script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(config.googleMapsApiKey)}&loading=async&callback=ecorutaMapReady&v=weekly`;
   script.onerror=()=>{clearTimeout(timer);script.remove();loading=undefined;reject(new Error('No se pudo descargar Google Maps.'));};
   document.head.appendChild(script);
  });
 }
 await loading;
 const {Map,InfoWindow}=await google.maps.importLibrary('maps');
 const {AdvancedMarkerElement}=await google.maps.importLibrary('marker');
 const map=new Map(element,{center:{lat:-2.184,lng:-79.881},zoom:13,mapId:'DEMO_MAP_ID',mapTypeControl:false});
 const bounds=new google.maps.LatLngBounds();
 places.forEach(p=>{
  const position={lat:p.lat,lng:p.lng};bounds.extend(position);
  const marker=new AdvancedMarkerElement({map,position,title:p.name});
  marker.addListener('click',()=>{const text=document.createElement('p');text.textContent=p.name;new InfoWindow({content:text}).open({map,anchor:marker});});
 });
 if(places.length>1)map.fitBounds(bounds,35);
 else if(places[0]){map.setCenter({lat:places[0].lat,lng:places[0].lng});map.setZoom(15);}
 return map;
}

/** Render a usable public map without credentials; prefer custom Maps API when configured. */
export async function showGoogleMap(config,places,element){
 if(!places.length)throw new Error('No hay lugares para mostrar.');
 if(!navigator.onLine)throw new Error('El mapa de Google necesita internet. Puedes consultar las coordenadas y tus notas sin conexión.');
 let apiError=false;
 if(config.googleMapsApiKey){
  try{await showJavaScriptMap(config,places,element);return {mode:'javascript'};}
  catch{apiError=true;element.replaceChildren();}
 }
 const frame=document.createElement('iframe');
 frame.title=`Mapa de Google: ${places[0].name}`;
 frame.src=mapsEmbedURL(places[0]);
 frame.referrerPolicy='no-referrer-when-downgrade';
 frame.allowFullscreen=true;
 element.replaceChildren(frame);
 // Cross-origin frames do not expose map readiness or auth errors to this page.
 // Keep external Maps URLs visible even if browser/privacy settings block the frame.
 return {mode:'embed',apiError};
}
