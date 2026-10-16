let loading;
export async function showGoogleMap(config,places,element){
 if(!navigator.onLine)throw new Error('El mapa necesita internet. Los lugares y tus notas siguen disponibles sin conexión.');
 if(!config.googleMapsApiKey)throw new Error('El mapa integrado necesita una API key de Google Maps en config.js. Puedes usar «Cómo llegar» para abrir Google Maps.');
 if(!loading){
  loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   const timer=setTimeout(()=>{loading=undefined;reject(new Error('Google Maps tardó demasiado. Revisa tu conexión.'));},15000);
   window.ecorutaMapReady=()=>{clearTimeout(timer);resolve();};
   window.gm_authFailure=()=>{clearTimeout(timer);loading=undefined;reject(new Error('Google Maps no autorizó la clave. Revisa la API, la facturación y los dominios permitidos.'));};
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
