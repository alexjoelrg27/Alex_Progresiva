/* All providers return a validated, uniform catalogue. No DOM access here. */
export function normalize(rows) {
  if(!Array.isArray(rows) || !rows.length || rows.length>500) throw new Error('El catálogo debe contener entre 1 y 500 lugares.');
  const ids=new Set();
  return rows.map(row=>{
    const p={};
    for(const key of ['id','name','category','area','description','tip','icon']) {
      if(typeof row[key]!=='string' || !row[key].trim() || row[key].length>2000) throw new Error(`Campo inválido: ${key}`);
      p[key]=row[key].trim();
    }
    for(const key of ['lat','lng','duration','cost']) {
      if(row[key]===null || String(row[key]).trim()==='' || !Number.isFinite(Number(row[key]))) throw new Error(`Número inválido: ${key}`);
      p[key]=Number(row[key]);
    }
    if(Math.abs(p.lat)>90 || Math.abs(p.lng)>180 || p.duration<=0 || p.cost<0 || ids.has(p.id)) throw new Error('Coordenadas, duración, costo o identificador inválidos.');
    if(!['Naturaleza','Cultura','Paseo','Mirador'].includes(p.category)) throw new Error('Categoría no reconocida.');
    ids.add(p.id);return p;
  });
}
// RFC 4180-style quoted fields, including commas, escaped quotes and line breaks.
export function parseCSV(text){
  const rows=[];let row=[],value='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"') {if(quoted && text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(value);value='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';}
    else value+=c;
  }
  if(quoted)throw new Error('CSV incompleto.');
  row.push(value);if(row.some(Boolean))rows.push(row);
  const headers=rows.shift();if(!headers)throw new Error('CSV vacío.');
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
}
async function readFile(path,type='text'){
  const r=await fetch(path);if(!r.ok)throw new Error(`No se pudo leer ${path} (${r.status}).`);
  return type==='json'?r.json():r.text();
}
function decodeValue(v){
  if('stringValue' in v)return v.stringValue;
  if('integerValue' in v)return Number(v.integerValue);
  if('doubleValue' in v)return v.doubleValue;
  return null;
}
export class Catalog {
  constructor(db,config){this.db=db;this.config=config;}
  async load(source){
    let rows;
    if(source==='json')rows=await new Promise((resolve,reject)=>$.getJSON('./data/places.json').done(resolve).fail(()=>reject(new Error('No se pudo leer el catálogo JSON.'))));
    else if(source==='csv')rows=parseCSV(await readFile('./data/places.csv'));
    else if(source==='xml'){
      const doc=new DOMParser().parseFromString(await readFile('./data/places.xml'),'application/xml');
      if(doc.querySelector('parsererror'))throw new Error('XML inválido.');
      rows=[...doc.querySelectorAll('place')].map(p=>Object.fromEntries([...p.children].map(c=>[c.tagName,c.textContent])));
    }else if(source==='sqlite'){
      const input=normalize(await readFile('./data/places.json','json'));
      this.sql ||= await window.initSqlJs({locateFile:file=>`./vendor/${file}`});
      const db=new this.sql.Database();
      try{
        db.run('CREATE TABLE places (id TEXT PRIMARY KEY, name TEXT, category TEXT, area TEXT, duration REAL, cost REAL, lat REAL, lng REAL, icon TEXT, description TEXT, tip TEXT)');
        const keys=['id','name','category','area','duration','cost','lat','lng','icon','description','tip'];
        const stmt=db.prepare('INSERT INTO places VALUES (?,?,?,?,?,?,?,?,?,?,?)');
        try{input.forEach(p=>stmt.run(keys.map(k=>p[k])));}finally{stmt.free();}
        const result=db.exec('SELECT * FROM places ORDER BY name')[0];
        rows=result.values.map(r=>Object.fromEntries(result.columns.map((k,i)=>[k,r[i]])));
      }finally{db.close();}
    }else if(source==='firestore'){
      const c=this.config;
      if(!c.firestoreProjectId || !c.firestoreApiKey)throw new Error('Configura el proyecto y la API key de Firestore en config.js.');
      if(!navigator.onLine)throw new Error('Firestore necesita conexión. El catálogo guardado sigue disponible.');
      const url=new URL(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(c.firestoreProjectId)}/databases/(default)/documents/${encodeURIComponent(c.firestoreCollection||'places')}`);
      url.searchParams.set('key',c.firestoreApiKey);url.searchParams.set('pageSize','100');
      rows=[];
      do{
        const r=await fetch(url,{signal:AbortSignal.timeout(15000)});
        if(!r.ok)throw new Error(`Firestore respondió ${r.status}. Revisa proyecto, API y permisos de lectura.`);
        const data=await r.json();
        rows.push(...(data.documents||[]).map(d=>({...Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,decodeValue(v)])),id:d.name.split('/').pop()})));
        if(rows.length>500)throw new Error('El catálogo remoto supera el límite de 500 lugares.');
        if(!data.nextPageToken)break;
        url.searchParams.set('pageToken',data.nextPageToken);
      }while(true);
    }else throw new Error('Fuente no reconocida.');
    const places=normalize(rows);await this.db.cacheCatalog(places);return places;
  }
}
