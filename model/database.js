/** IndexedDB: durable user state, isolated from read-only catalogue sources. */
export class LocalDatabase {
  async open() {
    this.db = await new Promise((resolve,reject) => {
      const r = indexedDB.open('ecoruta',1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore('favorites',{keyPath:'id'});
        r.result.createObjectStore('catalog',{keyPath:'id'});
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.onblocked = () => reject(new Error('Cierra otras pestañas de EcoRuta para actualizar los datos.'));
    });
    this.db.onversionchange = () => this.db.close();
  }
  transaction(store,mode,operation) {
    return new Promise((resolve,reject) => {
      const tx=this.db.transaction(store,mode);
      let result;
      const request=operation(tx.objectStore(store));
      if(request) request.onsuccess=()=>{result=request.result;};
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error || new Error('No se pudo completar el almacenamiento.'));
    });
  }
  all(store){return this.transaction(store,'readonly',s=>s.getAll());}
  saveFavorite(value){return this.transaction('favorites','readwrite',s=>s.put(value));}
  removeFavorite(id){return this.transaction('favorites','readwrite',s=>s.delete(id));}
  cacheCatalog(places){return this.transaction('catalog','readwrite',s=>{s.clear();places.forEach(p=>s.put(p));});}
}
