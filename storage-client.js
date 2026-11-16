(function(){
  // Cliente ligero que intenta sincronizar 'registros' con un servidor local en http://localhost:3000
  // Si el servidor no está disponible, se usará localStorage como fallback.
  const SERVER = 'http://localhost:3000';
  const ENDPOINT = SERVER + '/tipificaciones';
  let syncQueue = Promise.resolve();

  function isLocalFileMode(){
    try{
      return !!(window.SUIC_LOCAL_FILE_MODE || window.SUIC_USE_LOCAL_FILE || localStorage.getItem('suic_local_file_mode') === '1');
    }catch(e){
      return false;
    }
  }

  function isLocalOnlyMode(){
    try{
      return localStorage.getItem('suic_local_only') === '1';
    }catch(e){
      return false;
    }
  }

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
  async function syncRegistrosNow(arr) {
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

      if (isLocalOnlyMode()) {
        return true;
      }

      // Si existe fsSyncRegistros (File System Access) y está activado el modo archivo local, preferirlo
      if (isLocalFileMode()) {
        if (typeof window.fsSyncRegistros !== 'function') {
          console.error('[storage-client] modo Archivo Local activo, pero no hay acceso al archivo seleccionado');
          return false;
        }
        try {
          const r = await window.fsSyncRegistros(arrWithTimestamps);
          if (r) {
            try { localStorage.setItem('registros', JSON.stringify(arrWithTimestamps)); } catch (e) { }
            window.dispatchEvent(new CustomEvent('registros:synced', { detail: { count: arrWithTimestamps.length } }));
            return true;
          }
        } catch (e) { 
          console.warn('[storage-client] error en File System Access', e);
        }
        console.error('[storage-client] no se guardaron los cambios en el archivo local; no se usará otro almacenamiento');
        return false;
      }

      // Guardar una copia de respaldo solamente cuando el modo Archivo Local no está activo.
      try {
        await saveToIDB(arrWithTimestamps);
        console.info('[storage-client] respaldo en IndexedDB guardado');
      } catch (e) { /* ignore */ }

      // siempre actualizar localStorage primero (sincrónico)
      try { localStorage.setItem('registros', JSON.stringify(arrWithTimestamps)); } catch (e) { }

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
  }

  window.syncRegistros = function(arr) {
    const snapshot = Array.isArray(arr)
      ? arr.map(item => Array.isArray(item) ? [...item] : item)
      : [];
    const operation = syncQueue.then(() => syncRegistrosNow(snapshot));
    syncQueue = operation.catch(() => false);
    return operation;
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

  // Función para cargar datos desde almacenamiento.
  // Ahora prioriza el estado actual del navegador (localStorage) y evita sobrescribirlo
  // con datos más viejos del servidor, archivo o backups automáticos.
  window.loadRegistrosFromStorage = async function(){
    console.info('[storage-client] iniciando carga de datos desde almacenamiento...');

    if (isLocalOnlyMode()) {
      try{
        const stored = localStorage.getItem('registros');
        const parsed = stored ? JSON.parse(stored) : [];
        const data = Array.isArray(parsed) ? parsed : [];
        window.dispatchEvent(new CustomEvent('registros:loaded', { detail: { registros: data, count: data.length, source: 'localStorage' } }));
        return data;
      }catch(e){
        console.error('[storage-client] error leyendo datos en modo Disco Local', e);
        return [];
      }
    }

    if (isLocalFileMode()) {
      if (typeof window.fsSyncRegistros === 'function') {
        try{
          const fileData = await window.fsSyncRegistros();
          if (Array.isArray(fileData)) {
            try{ localStorage.setItem('registros', JSON.stringify(fileData)); }catch(e){}
            window.dispatchEvent(new CustomEvent('registros:loaded', { detail: { registros: fileData, count: fileData.length, source: 'file' } }));
            return fileData;
          }
        }catch(e){
          console.error('[storage-client] error leyendo el archivo seleccionado', e);
        }
      }
      console.error('[storage-client] modo Archivo Local activo, pero no se pudo leer el archivo seleccionado');
      try{
        const stored = localStorage.getItem('registros');
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
      }catch(e){
        console.error('[storage-client] error leyendo respaldo local', e);
        return [];
      }
    }

    // 1) Priorizar localStorage: si ya hay datos actuales, usarlos y no sobrescribirlos.
    try{
      const stored = localStorage.getItem('registros');
      if(stored){
        const parsed = JSON.parse(stored);
        if(Array.isArray(parsed)){
          console.info('[storage-client] usando datos actuales de localStorage, registros=', parsed.length);
          window.dispatchEvent(new CustomEvent('registros:loaded', { detail: { registros: parsed, count: parsed.length, source: 'localStorage' } }));
          return parsed;
        }
      }
    }catch(e){ console.info('[storage-client] error parseando localStorage'); }

    const sources = [];

    // 2) Solo si localStorage está vacío, intentar cargar desde otras fuentes como respaldo.
    if(typeof window.fsSyncRegistros === 'function'){
      try{
        const result = await window.fsSyncRegistros(); // sin argumento = leer
        if(result && Array.isArray(result)){
          sources.push(result);
          console.info('[storage-client] datos cargados desde File System API, registros=', result.length);
        }
      }catch(e){ console.info('[storage-client] File System API no disponible'); }
    }

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

    try{
      const idbData = await readFromIDB();
      if(Array.isArray(idbData) && idbData.length > 0){
        sources.push(idbData);
        console.info('[storage-client] datos desde IndexedDB, registros=', idbData.length);
      }
    }catch(e){ console.info('[storage-client] no disponible IndexedDB'); }

    const merged = mergeRegistrosData(sources);

    if(merged.length > 0){
      try{ localStorage.setItem('registros', JSON.stringify(merged)); }catch(e){}
      window.dispatchEvent(new CustomEvent('registros:loaded', { detail: { registros: merged, count: merged.length, source: 'fallback' } }));
      console.info('[storage-client] datos cargados desde respaldo alternativo, total registros=', merged.length);
      return merged;
    }

    console.info('[storage-client] no se encontraron datos, retornando vacío');
    return [];
  };

  // Inicializar solo si no hay datos actuales en localStorage.
  // Esto evita sobrescribir cambios recientes con una copia antigua del servidor.
  document.addEventListener('DOMContentLoaded', async ()=>{
    try{
      if (!isLocalOnlyMode() && !isLocalFileMode()) {
        const stored = localStorage.getItem('registros');
        const hasCurrentData = !!stored && stored !== '[]' && stored !== '';
        if(hasCurrentData) {
          console.info('[storage-client] se conserva el estado actual de localStorage, no se sobrescribe desde servidor');
        } else {
          const available = await isServerAvailable();
          if(available){
            const serverData = await fetchServerData();
            if(Array.isArray(serverData) && serverData.length){
              try{ localStorage.setItem('registros', JSON.stringify(serverData));
                console.info('[storage-client] sincronización inicial: localStorage actualizado desde servidor');
                window.dispatchEvent(new Event('registros:server-sync'));
              }catch(e){}
            }
          }
        }
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
