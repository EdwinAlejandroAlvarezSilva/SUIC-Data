(function(){
  // Cliente ligero que intenta sincronizar 'registros' con un servidor local en http://localhost:3000
  // Si el servidor no está disponible, se usará localStorage como fallback.
  const SERVER = 'http://localhost:3000';
  const ENDPOINT = SERVER + '/tipificaciones';

  async function isServerAvailable(){
    try{
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500); // 0.5 segundos timeout
      const res = await fetch(ENDPOINT, { method: 'GET', cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);
      const ok = res && res.ok;
      console.info('[storage-client] servidor disponible:', ok);
      return ok;
    }catch(e){ 
      if (e.name === 'AbortError') {
        console.info('[storage-client] timeout verificando servidor');
      } else {
        console.info('[storage-client] servidor no disponible');
      }
      return false; 
    }
  }

  async function fetchServerData(){
    try{
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 segundo timeout
      const res = await fetch(ENDPOINT, { method: 'GET', cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);
      if(!res.ok) return null;
      const j = await res.json();
      console.info('[storage-client] datos obtenidos desde servidor, elementos=', (j && j.data && j.data.length) || 0);
      return j && j.data ? j.data : null;
    }catch(e){ 
      if (e.name === 'AbortError') {
        console.info('[storage-client] timeout cargando desde servidor');
      } else {
        console.info('[storage-client] error cargando desde servidor:', e.message);
      }
      return null; 
    }
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
      // Agregar timestamp a cada registro si no tiene
      const now = Date.now();
      const arrWithTimestamps = arr.map(item => {
        if (Array.isArray(item) && item.length > 0) {
          // Si el último elemento no es un timestamp numérico, agregarlo
          const last = item[item.length - 1];
          if (typeof last !== 'number' || last < 1000000000000) { // timestamp aproximado
            return [...item, now];
          }
          // Si ya tiene timestamp, actualizarlo
          return [...item.slice(0, -1), now];
        }
        return item;
      });

      // Siempre guardar en IndexedDB como respaldo
      try {
        await saveToIDB(arrWithTimestamps);
        console.info('[storage-client] respaldo en IndexedDB guardado');
      } catch (e) { /* ignore */ }

      // Si existe fsSyncRegistros (File System Access) preferirlo
      if (typeof window.fsSyncRegistros === 'function') {
        try {
          const r = await window.fsSyncRegistros(arrWithTimestamps);
          if (r) {
            // Disparar evento para que auto-backup haga snapshot
            window.dispatchEvent(new CustomEvent('registros:synced', { detail: { count: arrWithTimestamps.length } }));
            return true;
          } else {
            console.info('[storage-client] File System Access falló, intentando servidor');
          }
        } catch (e) { 
          console.warn('[storage-client] error en File System Access', e);
        }
      }

      // siempre actualizar localStorage primero (sincrónico)
      try { localStorage.setItem('registros', JSON.stringify(arrWithTimestamps)); } catch (e) { }

      // Intentar enviar via sendBeacon (útil en unload/close)
      try{
        if(navigator && typeof navigator.sendBeacon === 'function'){
          try{
            const blob = new Blob([JSON.stringify(arrWithTimestamps)], { type: 'application/json' });
            const sent = navigator.sendBeacon(ENDPOINT, blob);
            console.info('[storage-client] sendBeacon enviado:', sent);
          }catch(e){ /* ignore */ }
        }
      }catch(e){ /* ignore */ }

      const ok = await pushServerData(arrWithTimestamps);

      // Disparar evento para que auto-backup haga snapshot
      window.dispatchEvent(new CustomEvent('registros:synced', { detail: { count: arrWithTimestamps.length, source: ok ? 'server' : 'local' } }));

      if (!ok) {
        console.info('[storage-client] servidor local no disponible, guardado en IndexedDB+localStorage');
        // Mostrar mensaje si tampoco hay File System
        if (typeof window.fsSyncRegistros !== 'function' || !(await window.fsSyncRegistros())) {
          console.warn('[storage-client] ni servidor ni File System disponibles - datos solo en navegador local');
          // Solo mostrar alerta si es la primera vez o si hay muchos datos
          if (arrWithTimestamps.length > 0 && !localStorage.getItem('sync_warning_shown')) {
            alert('⚠️ Los cambios se guardaron solo localmente en este navegador. Para sincronización completa:\n\n1. Ejecuta el servidor local (node server.js)\n2. O selecciona un archivo local con el botón "📁 Usar Archivo Local"');
            localStorage.setItem('sync_warning_shown', 'true');
          }
        }
      }
      return ok;
    } catch (e) { console.error('[storage-client] error sincronizando', e); return false; }
  };

  // Función helper para merge datos de múltiples fuentes basado en timestamps
  function mergeRegistrosData(sources) {
    const merged = new Map(); // key: identificador único, value: registro con timestamp más reciente

    sources.forEach(source => {
      if (!Array.isArray(source)) return;
      source.forEach(item => {
        if (!Array.isArray(item) || item.length === 0) return;
        
        // Usar el primer campo como ID único (asumiendo fecha de inicio)
        const id = item[0] || JSON.stringify(item.slice(0, -1)); // si no hay fecha, usar contenido
        const timestamp = typeof item[item.length - 1] === 'number' ? item[item.length - 1] : 0;
        
        if (!merged.has(id) || merged.get(id).timestamp < timestamp) {
          merged.set(id, { item, timestamp });
        }
      });
    });

    // Retornar array ordenado por timestamp descendente
    return Array.from(merged.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(entry => entry.item);
  }

  // Función para detectar conflictos de sincronización
  function detectConflicts(currentData, newData) {
    if (!Array.isArray(currentData) || !Array.isArray(newData)) return false;
    
    const currentMap = new Map();
    currentData.forEach(item => {
      if (Array.isArray(item)) {
        const id = item[0] || JSON.stringify(item.slice(0, -1));
        const ts = typeof item[item.length - 1] === 'number' ? item[item.length - 1] : 0;
        currentMap.set(id, ts);
      }
    });

    let hasConflict = false;
    newData.forEach(item => {
      if (Array.isArray(item)) {
        const id = item[0] || JSON.stringify(item.slice(0, -1));
        const ts = typeof item[item.length - 1] === 'number' ? item[item.length - 1] : 0;
        const currentTs = currentMap.get(id);
        if (currentTs && ts < currentTs) {
          hasConflict = true;
        }
      }
    });

    return hasConflict;
  }

  // Función para cargar datos desde archivo/servidor (restauración automática)
  window.loadRegistrosFromStorage = async function(){
    console.info('[storage-client] iniciando carga de datos desde almacenamiento...');
    const sources = [];

    // Cargar desde File System Access API
    if(typeof window.fsSyncRegistros === 'function'){
      try{
        const result = await window.fsSyncRegistros(); // sin argumento = leer
        if(result && Array.isArray(result)){
          sources.push(result);
          console.info('[storage-client] datos cargados desde File System API, registros=', result.length);
        }
      }catch(e){ console.info('[storage-client] File System API no disponible'); }
    }

    // Cargar desde servidor
    try{
      const available = await isServerAvailable();
      if(available){
        const serverData = await fetchServerData();
        if(Array.isArray(serverData)){
          sources.push(serverData);
          console.info('[storage-client] datos cargados desde servidor, registros=', serverData.length);
        }
      }
    }catch(e){ console.info('[storage-client] no se pudo cargar desde servidor'); }

    // Cargar desde localStorage
    try{
      const stored = localStorage.getItem('registros');
      if(stored){
        const parsed = JSON.parse(stored);
        if(Array.isArray(parsed)){
          sources.push(parsed);
          console.info('[storage-client] datos de localStorage, registros=', parsed.length);
        }
      }
    }catch(e){ console.info('[storage-client] error parseando localStorage'); }

    // Cargar desde IndexedDB
    try{
      const idbData = await readFromIDB();
      if(Array.isArray(idbData) && idbData.length > 0){
        sources.push(idbData);
        console.info('[storage-client] datos desde IndexedDB, registros=', idbData.length);
      }
    }catch(e){ console.info('[storage-client] no disponible IndexedDB'); }

    // Merge todos los datos
    const merged = mergeRegistrosData(sources);

    if(merged.length > 0){
      // Actualizar localStorage con datos merged
      try{ localStorage.setItem('registros', JSON.stringify(merged)); }catch(e){}
      window.dispatchEvent(new CustomEvent('registros:loaded', { detail: { registros: merged, count: merged.length } }));
      console.info('[storage-client] datos merged y cargados, total registros=', merged.length);
      return merged;
    }

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

    // Agregar listener para cross-tab synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === 'registros' && e.newValue) {
        try {
          const updatedData = JSON.parse(e.newValue);
          // Verificar si hay datos actuales en memoria o localStorage
          let currentData = [];
          try {
            const currentStored = localStorage.getItem('registros');
            if (currentStored) currentData = JSON.parse(currentStored);
          } catch (err) {}

          if (detectConflicts(currentData, updatedData)) {
            console.warn('[storage-client] conflicto detectado: datos más antiguos intentando sobrescribir más recientes');
            alert('Advertencia: Se detectó un posible conflicto de sincronización. Los datos pueden haber revertido a una versión anterior. Verifica tus cambios.');
          }

          console.info('[storage-client] cross-tab sync: datos actualizados desde otra pestaña, registros=', updatedData.length);
          window.dispatchEvent(new CustomEvent('registros:cross-tab-updated', { detail: { registros: updatedData } }));
        } catch (err) {
          console.error('[storage-client] error en cross-tab sync', err);
        }
      }
    });
  });

})();
