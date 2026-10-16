export const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function artwork(icon){
 const colors={river:['#c5ddd4','#83b5ba'],houses:['#f0d7b8','#cf9e79'],forest:['#d0debb','#6a956f'],park:['#e5e7bd','#8ba775'],hill:['#d9e3d0','#779273'],heritage:['#e6dac6','#b6a17d']};
 const [sky,base]=colors[icon]||colors.park;
 let scene='';
 if(icon==='river')scene='<path d="M0 115 Q130 70 400 105 L400 200 H0Z" fill="#79aeb2"/><path d="M0 137 Q170 90 400 121" stroke="#e6e4c4" stroke-width="18" fill="none"/><g fill="#e8e9ce"><path d="M28 104V69h12v35M44 100V52h20v48M70 97V75h17v22M330 106V62h20v44"/></g><path d="M180 83l34-40v40z" fill="#fff9dd"/><path d="M175 89h53l-9 8h-34z" fill="#496d65"/><path d="M35 158q75-16 140-9m42-9 60-3" fill="none" stroke="#c1d9d3" stroke-width="2"/>';
 else if(icon==='houses'||icon==='hill')scene='<path d="M0 170Q180 20 400 134V200H0" fill="'+base+'"/><path d="M156 200q35-50 111-99" stroke="#e3d2ac" stroke-width="16" fill="none"/><g stroke="#a47253" stroke-width="3"><path d="M82 148v-50h44v50" fill="#e1ac76"/><path d="M135 121V73h37v48" fill="#db977b"/><path d="M186 100V61h32v39" fill="#e8cda0"/><path d="M263 110V39h23v71" fill="#f6e6bf"/></g><path d="M257 40l18-17 18 17z" fill="#a76a4e"/><path d="M275 23V10" stroke="#587052" stroke-width="3"/><g fill="#7a604e"><path d="M97 148v-20h12v20M148 121v-20h11v20M198 100V84h9v16"/></g>';
 else if(icon==='forest')scene='<path d="M0 144q150-45 400 0v56H0" fill="#749477"/><path d="M120 200l66-96h25l24 96" fill="#d8c29d"/><path d="M124 168h105m-87-26h79m-63-19h55" stroke="#a68e69" stroke-width="3"/><g stroke="#476a4c" stroke-width="7"><path d="M38 161V53M93 131V31M305 153V41M361 164V70"/></g><g fill="#547e55"><circle cx="40" cy="58" r="40"/><circle cx="89" cy="39" r="37"/><circle cx="310" cy="46" r="49"/><circle cx="369" cy="69" r="41"/></g>';
 else if(icon==='heritage')scene='<path d="M0 156q200-29 400 0v44H0" fill="#8eaa7d"/><path d="M100 151V72h204v79" fill="#f0e5c7"/><path d="M88 74l114-42 115 42z" fill="#956d50"/><g fill="#607a62"><path d="M119 151v-45h20v45M163 151v-45h20v45M208 151v-45h20v45M253 151v-45h20v45"/></g><path d="M98 99h207M102 143h202" stroke="#c7b88e" stroke-width="6"/><path d="M52 178h294" stroke="#dacba3" stroke-width="13"/>';
 else scene='<path d="M0 158Q200 102 400 158v42H0" fill="#91aa76"/><path d="M140 200q20-55 102-67" fill="none" stroke="#dcd5af" stroke-width="22"/><path d="M64 160V66m270 99V59" stroke="#7e8059" stroke-width="13"/><g fill="#78905e"><circle cx="50" cy="59" r="47"/><circle cx="90" cy="58" r="43"/><circle cx="330" cy="52" r="50"/><circle cx="371" cy="64" r="39"/></g><path d="M165 116V76h66v40" fill="#efdfb5"/><path d="M155 77l44-28 43 28z" fill="#ad9670"/>';
 return `<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="400" height="200" fill="${sky}"/><circle cx="302" cy="43" r="24" fill="#f4e7b4"/>${scene}<g fill="#40614c" opacity=".7"><path d="M160 32q6-7 12 0 6-7 12 0" fill="none" stroke="#40614c" stroke-width="2"/></g></svg>`;
}
export class View {
 constructor(){ $.fx.off=matchMedia('(prefers-reduced-motion: reduce)').matches; }
 toast(message){$('#toast').stop(true,true).text(message).fadeIn(180).delay(3200).fadeOut(200);}
 cards(places,favorites,target){
  const root=$(target).empty();
  if(!places.length){root.append('<div class="empty"><span>↗</span><h3>'+ (target==='#saved-grid'?'Tu próxima ruta empieza aquí':'Prueba otro camino')+'</h3><p>'+(target==='#saved-grid'?'Toca el corazón de un lugar para guardarlo y llevarlo contigo.':'No encontramos lugares con estos filtros.')+'</p><button class="primary" data-reset>Explorar todos los lugares ↗</button></div>');return;}
  for(const p of places){
   const saved=favorites.find(f=>f.id===p.id);
   const e=escapeHTML;
   root.append(`<article class="place-card"><div class="card-art">${artwork(p.icon)}<button class="favorite ${saved?'saved':''}" data-favorite="${e(p.id)}" aria-label="${saved?'Quitar':'Guardar'} ${e(p.name)}" aria-pressed="${!!saved}">${saved?'♥':'♡'}</button><span class="art-category">${e(p.category)}</span></div><div class="card-body"><span class="card-area">⌖ ${e(p.area)}</span><h3>${e(p.name)}</h3><p>${e(p.description)}</p><div class="card-meta"><span>◷ ${p.duration} min</span><span class="cost">${p.cost===0?'Al aire libre':'$'+p.cost.toFixed(2)}</span><button class="card-open" data-detail="${e(p.id)}" aria-label="Ver ${e(p.name)}">↗</button></div>${saved?.visited?'<span class="visited-badge">✓ Ya lo visité</span>':''}</div></article>`);
  }
 }
 render(places,favorites,category,query){
  const term=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const filtered=places.filter(p=>(category==='Todos'||p.category===category)&&`${p.name} ${p.area} ${p.category}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term));
  this.cards(filtered,favorites,'#catalog-grid');$('#catalog-grid').attr('aria-busy','false');
  this.cards(favorites.map(f=>f.place),favorites,'#saved-grid');
  $('#saved-count').text(favorites.length);$('#result-count').text(`${filtered.length} lugares para descubrir`);
  const minutes=favorites.reduce((n,f)=>n+f.place.duration,0);
  $('#route-summary').text(`${favorites.length} lugares · ${Math.floor(minutes/60)} h ${minutes%60} min de recorrido estimado`);
  $('#export-route').prop('disabled',!favorites.length);
 }
 detail(p,saved){
  const e=escapeHTML;
  $('#place-detail').html(`<div class="detail-art">${artwork(p.icon)}</div><span class="eyebrow">${e(p.category)} · ${e(p.area)}</span><h2 id="place-title">${e(p.name)}</h2><p>${e(p.description)}</p><p>◷ ${p.duration} minutos estimados · ⌖ ${p.lat}, ${p.lng}</p><p><strong>Antes de salir:</strong> ${e(p.tip)}</p><div class="detail-actions"><button class="primary" data-favorite="${e(p.id)}">${saved?'♥ Quitar de mi ruta':'♡ Guardar en mi ruta'}</button><button class="small-button" data-map="${e(p.id)}">Ver en Google Maps ↗</button><a class="small-button" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a></div>${saved?`<label for="note">Mi nota para este lugar</label><textarea id="note" maxlength="1000" placeholder="Qué llevar, qué quieres conocer…">${e(saved.note||'')}</textarea><label class="check-label"><input id="visited" type="checkbox" ${saved.visited?'checked':''}> Ya visité este lugar</label><button id="save-note" class="small-button" data-id="${e(p.id)}">Guardar nota y visita</button>`:'<p>Guarda este lugar para añadir notas y registrar tu visita.</p>'}`);
 }
 page(name){$('.page').prop('hidden',true);$(`#${name}-page`).prop('hidden',false);$('.nav').removeClass('active').removeAttr('aria-current');$(`[data-page="${name}"]`).addClass('active').attr('aria-current','page');}
}
