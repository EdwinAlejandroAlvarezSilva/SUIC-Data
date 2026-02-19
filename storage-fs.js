(function(){
  // File System Access API helper: permite seleccionar un archivo JSON y leer/escribir registros directamente
  // Guarda el handle en IndexedDB para persistencia entre sesiones (si el navegador lo permite)

  const DB_NAME = 'suic_fs_db_v1';
  const STORE = 'handles';
  const KEY = 'tipificaciones';

  function openDB(){
    return new Promise((resolve, reject)=>{
      try{
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e)=>{
          const db = e.target.result;
          if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        req.onsuccess = ()=> resolve(req.result);
        req.onerror = ()=> reject(req.error);
      }catch(e){ reject(e); }
    });
  }

  async function getHandle(){
    try{
      const db = await openDB();
      return await new Promise((resolve)=>{
        const tx = db.transaction(STORE, 'readonly');
        const st = tx.objectStore(STORE);
        const r = st.get(KEY);
        r.onsuccess = ()=>{ db.close(); resolve(r.result); };
        r.onerror = ()=>{ db.close(); resolve(null); };
      });
    }catch(e){ return null; }
  }

  async function saveHandle(handle){
    try{
      const db = await openDB();
      return await new Promise((resolve)=>{
        const tx = db.transaction(STORE, 'readwrite');
        const st = tx.objectStore(STORE);
        const r = st.put(handle, KEY);
        r.onsuccess = ()=>{ db.close(); resolve(true); };
        r.onerror = ()=>{ db.close(); resolve(false); };
      });
    }catch(e){ return false; }
  }

  async function readFromHandle(handle){
    try{
      if(!handle) return null;
      const file = await handle.getFile();
      const text = await file.text();
      try{ return JSON.parse(text || '[]'); }catch(e){ return []; }
    }catch(e){ return null; }
  }

  async function writeToHandle(handle, arr){
    try{
      if(!handle) return false;
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(arr || [], null, 2));
      await writable.close();
      return true;
    }catch(e){ console.error('[fs] write error', e); return false; }
  }

  async function pickFile(){
    if(window.showSaveFilePicker){
      try{
        const handle = await window.showSaveFilePicker({
          suggestedName: 'tipificaciones.json',
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        return handle;
      }catch(e){ return null; }
    }
    return null;
  }

  // Exponer API global
  window.fsSyncRegistros = async function(arr){
    try{
      // Si arr provided, write; else try read first
      let handle = await getHandle();
      if(!handle){ console.info('[fs] no hay handle guardado, pedir al usuario que seleccione archivo'); return false; }
      // try request permission for write
      try{
        if(handle.requestPermission){
          const perm = await handle.requestPermission({ mode: 'readwrite' });
          if(perm !== 'granted') { console.info('[fs] permiso denegado para archivo'); return false; }
        }
      }catch(e){ /* ignore */ }

      if(Array.isArray(arr)){
        const ok = await writeToHandle(handle, arr);
        if(ok) console.info('[fs] guardado en archivo');
        return ok;
      }else{
        const data = await readFromHandle(handle);
        if(Array.isArray(data)){
          try{ localStorage.setItem('registros', JSON.stringify(data)); }catch(e){}
          window.dispatchEvent(new Event('registros:server-sync'));
          console.info('[fs] leído y actualizado localStorage desde archivo, items=', data.length);
          return true;
        }
        return false;
      }
    }catch(e){ console.error('[fs] error sync', e); return false; }
  };

  // UI: botón discreto para que el usuario seleccione el archivo (one-time)
  function injectButton(){
    try{
      const existing = document.getElementById('btn-select-storage-file');
      if(existing) return;
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.bottom = '12px';
      wrapper.style.right = '12px';
      wrapper.style.zIndex = '9999';

      const btn = document.createElement('button');
      btn.id = 'btn-select-storage-file';
      btn.type = 'button';
      btn.textContent = 'Usar archivo como Almacenamiento';
      btn.title = 'Selecciona un archivo local para que SUIC Data lo use como almacenamiento persistente';
      btn.style.padding = '8px 12px';
      btn.style.borderRadius = '10px';
      btn.style.border = '1px solid rgba(0,0,0,0.08)';
      btn.style.background = '#f8fafc';
      btn.style.color = '#0b1220';
      btn.style.cursor = 'pointer';
      btn.style.boxShadow = '0 6px 18px rgba(2,6,23,0.06)';
      btn.style.fontSize = '12px';

      btn.addEventListener('click', async ()=>{
        const handle = await pickFile();
        if(!handle){ alert('No se seleccionó archivo.'); return; }
        const saved = await saveHandle(handle);
        if(!saved){ alert('No se pudo guardar el permiso.'); return; }
        // Intentar leer contenido existente y aplicar
        const data = await readFromHandle(handle);
        if(Array.isArray(data)){
          try{ localStorage.setItem('registros', JSON.stringify(data)); }catch(e){}
          window.dispatchEvent(new Event('registros:server-sync'));
        }
        alert('Archivo seleccionado y listo. A partir de ahora los cambios se guardarán allí cuando sea posible.');
      });

      wrapper.appendChild(btn);
      document.body.appendChild(wrapper);
    }catch(e){ /* ignore */ }
  }

  // Intentar auto-inject si API disponible
  document.addEventListener('DOMContentLoaded', ()=>{
    if(window.showSaveFilePicker && typeof indexedDB !== 'undefined'){
      injectButton();
      // si ya tenemos handle, intentar leerlo
      (async ()=>{
        const handle = await getHandle();
        if(handle){ try{ await window.fsSyncRegistros(); }catch(e){} }
      })();
    }
  });

})();
