/** Google Maps URLs: documented integration that does not require an API key. */
export function coordinates(place){
 if(!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lng) || Math.abs(place.lat)>90 || Math.abs(place.lng)>180)throw new Error('El lugar no tiene coordenadas válidas.');
 return `${place.lat},${place.lng}`;
}
export function mapsSearchURL(place){
 const url=new URL('https://www.google.com/maps/search/');
 url.search=new URLSearchParams({api:'1',query:coordinates(place)});return url.href;
}
export function mapsDirectionsURL(place,mode='walking'){
 if(!['walking','driving','bicycling','transit'].includes(mode))throw new Error('Medio de transporte no válido.');
 const url=new URL('https://www.google.com/maps/dir/');
 url.search=new URLSearchParams({api:'1',destination:coordinates(place),travelmode:mode});return url.href;
}
export function mapsEmbedURL(place){
 // Public Google Maps web embed. This is not the authenticated Maps Embed API.
 const url=new URL('https://maps.google.com/maps');
 url.search=new URLSearchParams({q:coordinates(place),z:'15',output:'embed',hl:'es'});return url.href;
}
