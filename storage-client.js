(function(){
  // Cliente ligero que intenta sincronizar 'registros' con un servidor local en http://localhost:3000
  // Si el servidor no está disponible, se usará localStorage como fallback.
  const SERVER = 'http://localhost:3000';
  const ENDPOINT = SERVER + '/tipificaciones';

  async function isServerAvailable(){
    try{
      const res = await fetch(ENDPOINT, { method: 'GET', cache: 'no-store' });
      const ok = res && res.ok;
      console.info('[storage-client] servidor disponible:', ok);
      return ok;
    }catch(e){ console.info('[storage-client] servidor no disponible'); return false; }
  }

  async function fetchServerData(){
    try{
      const res = await fetch(ENDPOINT, { method: 'GET', cache: 'no-store' });
      if(!res.ok) return null;
      const j = await res.json();
      console.info('[storage-client] datos obtenidos desde servidor, elementos=', (j && j.data && j.data.length) || 0);
      return j && j.data ? j.data : null;
    }catch(e){ return null; }
  }

  async function pushServerData(arr){
    try{
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arr)
      });
      if(!res.ok) throw new Error('server error');
      console.info('[storage-client] push exitoso al servidor, registros=', (arr && arr.length) || 0);
      return true;
    }catch(e){ return false; }
  }

  // Base de datos IndexedDB como almacenamiento persistente alternativo
  const IDB_NAME = 'suic_data_backup_db';
  const IDB_STORE = 'registros_backup';

  async function openIDB() {
    return new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  async function saveToIDB(arr) {
    try {
      const db = await openIDB();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const st = tx.objectStore(IDB_STORE);
        const r = st.put(arr, 'registros');
        r.onsuccess = () => { db.close(); resolve(true); };
        r.onerror = () => { db.close(); resolve(false); };
      });
    } catch (e) { return false; }
  }

  async function readFromIDB() {
    try {
      const db = await openIDB();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const st = tx.objectStore(IDB_STORE);
        const r = st.get('registros');
        r.onsuccess = () => {
          db.close();
          const data = r.result;
          resolve(Array.isArray(data) ? data : null);
        };
        r.onerror = () => { db.close(); resolve(null); };
      });
    } catch (e) { return null; }
  }

  // Exponer función global para que codigo.js la invoque. Preferir File System API si existe.
  window.syncRegistros = async function(arr) {
    try {
      // Siempre guardar en IndexedDB como respaldo
      try {
        await saveToIDB(arr);
        console.info('[storage-client] respaldo en IndexedDB guardado');
      } catch (e) { /* ignore */ }

      // Si existe fsSyncRegistros (File System Access) preferirlo
      if (typeof window.fsSyncRegistros === 'function') {
        try {
          const r = await window.fsSyncRegistros(arr);
          if (r) {
            // Disparar evento para que auto-backup haga snapshot
            window.dispatchEvent(new CustomEvent('registros:synced', { detail: { count: arr.length } }));
            return true;
          }
        } catch (e) { /* continue to server fallback */ }
      }

      // siempre actualizar localStorage primero (sincrónico)
      try { localStorage.setItem('registros', JSON.stringify(arr)); } catch (e) { }

      // Intentar enviar via sendBeacon (útil en unload/close)
      try{
        if(navigator && typeof navigator.sendBeacon === 'function'){
          try{
            const blob = new Blob([JSON.stringify(arr)], { type: 'application/json' });
            const sent = navigator.sendBeacon(ENDPOINT, blob);
            console.info('[storage-client] sendBeacon enviado:', sent);
          }catch(e){ /* ignore */ }
        }
      }catch(e){ /* ignore */ }

      const ok = await pushServerData(arr);

      // Disparar evento para que auto-backup haga snapshot
      window.dispatchEvent(new CustomEvent('registros:synced', { detail: { count: arr.length, source: ok ? 'server' : 'local' } }));

      if (!ok) console.info('[storage-client] servidor local no disponible, guardado en IndexedDB+localStorage');
      return ok;
    } catch (e) { console.error('[storage-client] error sincronizando', e); return false; }
  };

  // Función para cargar datos desde archivo/servidor (restauración automática)
  window.loadRegistrosFromStorage = async function(){
    console.info('[storage-client] iniciando carga de datos desde almacenamiento...');
    let loaded = null;

    // Intenta cargar desde File System Access API (primario) - llamar sin argumentos lee
    if(typeof window.fsSyncRegistros === 'function'){
      try{
        const result = await window.fsSyncRegistros(); // sin argumento = leer
        if(result){
          console.info('[storage-client] datos cargados desde File System API');
          // fsSyncRegistros actualiza localStorage automáticamente cuando lee
          try{
            const stored = localStorage.getItem('registros');
            if(stored) loaded = JSON.parse(stored);
          }catch(e){}
        }
      }catch(e){ console.info('[storage-client] File System API no disponible'); }
    }

    // Intenta cargar desde servidor (secundario) si FS API no funcionó
    if(!loaded){
      try{
        const available = await isServerAvailable();
        if(available){
          const serverData = await fetchServerData();
          if(Array.isArray(serverData)){
            loaded = serverData;
            console.info('[storage-client] datos cargados desde servidor, registros=', serverData.length);
          }
        }
      }catch(e){ console.info('[storage-client] no se pudo cargar desde servidor'); }
    }

    // Si no hay datos del servidor, usar localStorage
    if(!loaded){
      try{
        const stored = localStorage.getItem('registros');
        if(stored){
          loaded = JSON.parse(stored);
          console.info('[storage-client] usando datos de localStorage, registros=', loaded.length);
        }
      }catch(e){ console.info('[storage-client] error parseando localStorage'); }
    }

    // Si tampoco localStorage, intentar IndexedDB (respaldo)
    if(!loaded){
      try{
        const idbData = await readFromIDB();
        if(Array.isArray(idbData) && idbData.length > 0){
          loaded = idbData;
          console.info('[storage-client] recuperados datos desde IndexedDB respaldo, registros=', idbData.length);
        }
      }catch(e){ console.info('[storage-client] no disponible IndexedDB'); }
    }

    // Actualizar localStorage con datos cargados (si vinieron del servidor o FS API)
    if(Array.isArray(loaded) && loaded.length > 0){
      try{ localStorage.setItem('registros', JSON.stringify(loaded)); }catch(e){}
      window.dispatchEvent(new CustomEvent('registros:loaded', { detail: { registros: loaded, count: loaded.length } }));
      return loaded;
    }

    // Si todo falla o está vacío, retornar lo que esté en localStorage o vacío
    try{
      const fallback = localStorage.getItem('registros');
      if(fallback) return JSON.parse(fallback);
    }catch(e){}
    
    console.info('[storage-client] no se encontraron datos, retornando vacío');
    return [];
  };

  // Intentar inicializar registros desde servidor si existe una copia válida (on load)
  document.addEventListener('DOMContentLoaded', async ()=>{
    try{
      const available = await isServerAvailable();
      if(!available) return;
      const serverData = await fetchServerData();
      if(Array.isArray(serverData) && serverData.length){
        try{ localStorage.setItem('registros', JSON.stringify(serverData));
          console.info('[storage-client] sincronización inicial: localStorage actualizado desde servidor');
          window.dispatchEvent(new Event('registros:server-sync'));
        }catch(e){}
      }
    }catch(e){ /* ignore */ }
  });

})();
