/**
 * Sistema de Auto-Backup/Restore Automático
 * Guarda snapshots de datos automáticamente sin que el usuario haga nada
 * Si se pierden datos, se restauran automáticamente
 */

(function(){
  const IDB_NAME = 'suic_auto_backup_db';
  const IDB_STORE_SNAPSHOTS = 'backup_snapshots';
  const IDB_STORE_METADATA = 'backup_metadata';
  const MAX_BACKUPS = 10; // Mantener hasta 10 versiones
  const AUTO_BACKUP_INTERVAL = 300000; // 5 minutos (ajustado)
  
  // Abrir IndexedDB
  function openBackupDB(){
    return new Promise((resolve, reject)=>{
      try{
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = (e)=>{
          const db = e.target.result;
          if(!db.objectStoreNames.contains(IDB_STORE_SNAPSHOTS)){
            db.createObjectStore(IDB_STORE_SNAPSHOTS);
          }
          if(!db.objectStoreNames.contains(IDB_STORE_METADATA)){
            db.createObjectStore(IDB_STORE_METADATA);
          }
        };
        req.onsuccess = ()=> resolve(req.result);
        req.onerror = ()=> reject(req.error);
      }catch(e){ reject(e); }
    });
  }

  // Guardar snapshot en IndexedDB
  async function saveSnapshot(data){
    try{
      const db = await openBackupDB();
      const timestamp = Date.now();
      const snapshot = {
        data: data,
        timestamp: timestamp,
        count: Array.isArray(data) ? data.length : 0,
        version: `v${Math.floor(timestamp/1000)}`
      };

      return new Promise((resolve)=>{
        const tx = db.transaction([IDB_STORE_SNAPSHOTS, IDB_STORE_METADATA], 'readwrite');
        
        // Guardar snapshot
        const stSnapshots = tx.objectStore(IDB_STORE_SNAPSHOTS);
        stSnapshots.put(snapshot, `backup_${timestamp}`);

        // Guardar metadata (última copia)
        const stMetadata = tx.objectStore(IDB_STORE_METADATA);
        stMetadata.put({ timestamp, count: snapshot.count }, 'latest');

        tx.oncomplete = ()=>{
          db.close();
          console.info('[auto-backup] snapshot guardado:', snapshot.count, 'registros');
          _cleanOldBackups(db);
          try{ updateStatusUI(snapshot); }catch(e){}
          resolve(true);
        };
        tx.onerror = ()=>{
          db.close();
          console.warn('[auto-backup] error guardando snapshot');
          resolve(false);
        };
      });
    }catch(e){
      console.error('[auto-backup] error en saveSnapshot:', e);
      return false;
    }
  }

  // Obtener último snapshot
  async function getLatestSnapshot(){
    try{
      const db = await openBackupDB();
      return new Promise((resolve)=>{
        const tx = db.transaction(IDB_STORE_SNAPSHOTS, 'readonly');
        const st = tx.objectStore(IDB_STORE_SNAPSHOTS);

        // Obtener todas las claves y ordenar
        const getAllReq = st.getAllKeys();
        getAllReq.onsuccess = ()=>{
          const keys = getAllReq.result;
          if(keys.length === 0){
            db.close();
            resolve(null);
            return;
          }

          // Obtener el último (por timestamp en la key)
          const latestKey = keys.sort().reverse()[0];
          const getReq = st.get(latestKey);
          getReq.onsuccess = ()=>{
            db.close();
            const snapshot = getReq.result;
            if(snapshot){
              console.info('[auto-backup] snapshot encontrado:', snapshot.version, snapshot.count, 'registros');
            }
            resolve(snapshot);
          };
          getReq.onerror = ()=>{
            db.close();
            resolve(null);
          };
        };
        getAllReq.onerror = ()=>{
          db.close();
          resolve(null);
        };
      });
    }catch(e){
      console.error('[auto-backup] error en getLatestSnapshot:', e);
      return null;
    }
  }

  // Limpiar backups antiguos (mantener solo MAX_BACKUPS)
  async function _cleanOldBackups(db){
    try{
      const tx = db.transaction(IDB_STORE_SNAPSHOTS, 'readwrite');
      const st = tx.objectStore(IDB_STORE_SNAPSHOTS);
      
      st.getAllKeys().onsuccess = (e)=>{
        const keys = e.target.result.sort().reverse();
        // Eliminar los que excedan MAX_BACKUPS
        for(let i = MAX_BACKUPS; i < keys.length; i++){
          st.delete(keys[i]);
        }
      };
    }catch(e){
      console.warn('[auto-backup] error limpiando backups antiguos');
    }
  }

  // Restaurar el último snapshot
  async function restoreLatestSnapshot(){
    try{
      const snapshot = await getLatestSnapshot();
      if(!snapshot || !Array.isArray(snapshot.data)){
        console.info('[auto-backup] no hay snapshot para restaurar');
        return false;
      }

      // Restaurar en localStorage
      try{
        localStorage.setItem('registros', JSON.stringify(snapshot.data));
        console.info('[auto-backup] snapshot restaurado en localStorage:', snapshot.count, 'registros');
      }catch(e){
        console.warn('[auto-backup] error restaurando en localStorage');
      }

      // Disparar evento para que otras partes la apliquen
      window.dispatchEvent(new CustomEvent('backup:restored', {
        detail: { data: snapshot.data, count: snapshot.count, version: snapshot.version }
      }));
      try{ updateStatusUI(snapshot); }catch(e){}

      return true;
    }catch(e){
      console.error('[auto-backup] error en restoreLatestSnapshot:', e);
      return false;
    }
  }

  // Hacer backup automático
  async function autoBackup(){
    try{
      let datos = [];
      try{
        const stored = localStorage.getItem('registros');
        if(stored) datos = JSON.parse(stored);
      }catch(e){}

      if(Array.isArray(datos)){
        await saveSnapshot(datos);
      }
    }catch(e){
      console.error('[auto-backup] error en autoBackup:', e);
    }
  }

  // Exponer funciones globales
  window.autoBackupSnapshot = {
    save: saveSnapshot,
    restore: restoreLatestSnapshot,
    getLatest: getLatestSnapshot
  };

  // UI: indica estado discreto del último backup
  function updateStatusUI(snapshot){
    try{
      const pageIsRegistros = /Registros/i.test(document.title) || /Registros\.html$/i.test(window.location.pathname);
      if(pageIsRegistros){
        const existing = document.getElementById('suic-backup-status');
        if(existing) existing.remove();
        return;
      }
      if(!snapshot) return;
      let el = document.getElementById('suic-backup-status');
      if(!el){
        el = document.createElement('div');
        el.id = 'suic-backup-status';
        el.style.position = 'fixed';
        el.style.bottom = '12px';
        el.style.left = '12px';
        el.style.padding = '8px 10px';
        el.style.background = '#f8fafc';
        el.style.color = '#0b1220';
        el.style.fontSize = '12px';
        el.style.borderRadius = '8px';
        el.style.border = '1px solid rgba(0,0,0,0.08)';
        el.style.zIndex = '9999';
        el.style.maxWidth = '320px';
        el.style.boxShadow = '0 6px 18px rgba(2,6,23,0.06)';
        el.style.opacity = '0.95';
        document.body.appendChild(el);
      }
      const time = new Date(snapshot.timestamp);
      const timeStr = `${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}:${String(time.getSeconds()).padStart(2,'0')} ${String(time.getDate()).padStart(2,'0')}/${String(time.getMonth()+1).padStart(2,'0')}/${time.getFullYear()}`;
      el.textContent = `Último backup: ${timeStr} · ${snapshot.version} · ${snapshot.count} registros`;
    }catch(e){ /* ignore */ }
  }

  // Inicializar en page load
  document.addEventListener('DOMContentLoaded', async ()=>{
    console.info('[auto-backup] inicializando sistema de auto-backup');

    // Intenta restaurar el último snapshot si localStorage está vacío
    try{
      const stored = localStorage.getItem('registros');
      if(!stored || stored === '[]' || stored === ''){
        console.info('[auto-backup] localStorage vacío, intentando restaurar snapshot');
        await restoreLatestSnapshot();
      }
    }catch(e){
      console.warn('[auto-backup] error verificando localStorage');
    }

    // Mostrar estado del último snapshot si existe
    try{
      const last = await getLatestSnapshot();
      const pageIsRegistros = /Registros/i.test(document.title) || /Registros\.html$/i.test(window.location.pathname);
      if(pageIsRegistros){
        const existing = document.getElementById('suic-backup-status');
        if(existing) existing.remove();
      } else if(last) {
        updateStatusUI(last);
      }
    }catch(e){}

    // Iniciar auto-backup periódico
    setInterval(() => {
      autoBackup();
    }, AUTO_BACKUP_INTERVAL);

    console.info('[auto-backup] sistema activo, backup cada 10 minutos');
  });

  // Hacer backup también cuando el usuario intenta salir (para no perder el último cambio)
  window.addEventListener('beforeunload', ()=>{
    autoBackup();
  });

  // Escuchar cambios en registros y hacer backup más frecuente si hay eventos
  window.addEventListener('registros:loaded', ()=>{
    // Si se cargan nuevos datos, hacer backup inmediatamente
    autoBackup();
  });

  // Hacer backup automático cuando se sincronizan datos
  window.addEventListener('registros:synced', ()=>{
    console.info('[auto-backup] evento de sincronización, haciendo backup inmediato');
    autoBackup();
  });

})();
