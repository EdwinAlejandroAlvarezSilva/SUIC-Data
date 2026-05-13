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
      if(!handle){ 
        // Ya no se muestra mensaje redundante, solo retorna
        return false; 
      }
      // try request permission for write
      try{
        if(handle.requestPermission){
          const perm = await handle.requestPermission({ mode: 'readwrite' });
          if(perm !== 'granted') { 
            console.info('[fs] permiso denegado para archivo');
            alert('Permiso denegado para acceder al archivo. Los cambios no se guardarán en el archivo local.');
            showPermissionInstructions();
            return false; 
          }
        }
      }catch(e){ 
        console.warn('[fs] error solicitando permiso', e);
        alert('Error al solicitar permisos para el archivo. Es posible que el navegador no soporte esta función completamente.');
        return false;
      }

      if(Array.isArray(arr)){
        const ok = await writeToHandle(handle, arr);
        if(ok) {
          console.info('[fs] guardado en archivo');
          return true;
        } else {
          alert('Error al guardar en el archivo local. Verifica permisos y espacio disponible.');
          return false;
        }
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
    }catch(e){ 
      console.error('[fs] error sync', e); 
      alert('Error de sincronización con archivo local: ' + (e.message || 'Desconocido'));
      return false; 
    }
  };

  // Función para mostrar instrucciones de permisos
  function showPermissionInstructions(){
    const instructions = `
🔐 Para conceder permisos manualmente:

**En Chrome/Edge:**
1. Haz clic en el ícono de candado 🔒 en la barra de direcciones
2. Selecciona "Configuración del sitio"
3. En "Permisos", busca "Archivos" y selecciona "Permitir"

**En Firefox:**
1. Haz clic en el ícono de escudo 🛡️ en la barra de direcciones
2. Selecciona "Más información"
3. Ve a "Permisos" y permite "Acceder a archivos"

**Alternativa:** Usa el servidor local (node server.js) para sincronización sin permisos.

¿Quieres intentar de nuevo o usar el servidor?
    `;
    alert(instructions);
  }

  // UI: botones para gestionar archivo local
  function injectButtons(){
    try{
      const existing = document.getElementById('fs-controls-wrapper');
      if(existing) return;
      const wrapper = document.createElement('div');
      wrapper.id = 'fs-controls-wrapper';
      wrapper.style.position = 'fixed';
      wrapper.style.bottom = '12px';
      wrapper.style.right = '12px';
      wrapper.style.zIndex = '9999';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = '8px';
      wrapper.style.alignItems = 'stretch';
      wrapper.style.width = '220px'; // ancho fijo para todos los botones

      // Estilo común para los botones
      const commonBtnStyle = {
        padding: '12px 0',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: 'bold',
        width: '100%',
        minWidth: '180px',
        minHeight: '44px',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        display: 'block',
        textAlign: 'center',
      };

      // Botón Disco Local
      const btnLocal = document.createElement('button');
      btnLocal.id = 'btn-local-only';
      btnLocal.type = 'button';
      btnLocal.textContent = '💾 Usar Disco Local';
      btnLocal.title = 'Guardar datos solo en el navegador (localStorage), sin archivo ni servidor.';
      Object.assign(btnLocal.style, commonBtnStyle);
      btnLocal.style.border = '2px solid #059669';
      btnLocal.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      btnLocal.style.color = '#ffffff';
      btnLocal.addEventListener('mouseenter', () => {
        btnLocal.style.transform = 'translateY(-2px)';
        btnLocal.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
      });
      btnLocal.addEventListener('mouseleave', () => {
        btnLocal.style.transform = 'translateY(0)';
        btnLocal.style.boxShadow = 'none';
      });
      btnLocal.addEventListener('click', async () => {
        // Desactivar File System y servidor, forzar solo localStorage
        window.fsSyncRegistros = undefined;
        localStorage.setItem('suic_local_only', '1');
        // Borrar handle de archivo local en IndexedDB
        try {
          const db = await openDB();
          const tx = db.transaction(STORE, 'readwrite');
          const st = tx.objectStore(STORE);
          st.delete(KEY);
          tx.oncomplete = () => db.close();
          tx.onerror = () => db.close();
        } catch(e){}
        alert('Ahora los datos se guardarán solo en el navegador (localStorage).\nNo se usará archivo ni servidor.\nEsto es seguro pero solo para este navegador y usuario.');
      });

      // Botón Archivo Local
      const btnSelect = document.createElement('button');
      btnSelect.id = 'btn-select-storage-file';
      btnSelect.type = 'button';
      btnSelect.textContent = '📁 Usar Archivo Local';
      btnSelect.title = 'Selecciona un archivo local para almacenamiento persistente';
      Object.assign(btnSelect.style, commonBtnStyle);
      btnSelect.style.border = '2px solid #2563eb';
      btnSelect.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
      btnSelect.style.color = '#ffffff';
      btnSelect.addEventListener('mouseenter', () => {
        btnSelect.style.transform = 'translateY(-2px)';
        btnSelect.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.4)';
      });
      btnSelect.addEventListener('mouseleave', () => {
        btnSelect.style.transform = 'translateY(0)';
        btnSelect.style.boxShadow = 'none';
      });
      btnSelect.addEventListener('click', async ()=>{
        const handle = await pickFile();
        if(!handle){ 
          alert('No se seleccionó archivo. Los cambios se guardarán solo localmente hasta que selecciones un archivo.');
          return; 
        }
        const saved = await saveHandle(handle);
        if(!saved){ 
          alert('No se pudo guardar el permiso. Intenta de nuevo.');
          return; 
        }
        const data = await readFromHandle(handle);
        if(Array.isArray(data)){
          try{ localStorage.setItem('registros', JSON.stringify(data)); }catch(e){}
          window.dispatchEvent(new Event('registros:server-sync'));
        }
        alert('✅ Archivo seleccionado. Ahora los cambios se guardarán automáticamente en el archivo local.');
        wrapper.style.display = 'none';
      });

      // Botón Gestionar Permisos
      const btnPermisos = document.createElement('button');
      btnPermisos.type = 'button';
      btnPermisos.textContent = '🔐 Gestionar Permisos';
      btnPermisos.title = 'Verifica y configura permisos para archivos locales';
      Object.assign(btnPermisos.style, commonBtnStyle);
      btnPermisos.style.border = '2px solid #10b981';
      btnPermisos.style.background = 'linear-gradient(135deg, #f0fdf4, #a7f3d0)';
      btnPermisos.style.color = '#065f46';
      btnPermisos.addEventListener('mouseenter', () => {
        btnPermisos.style.transform = 'translateY(-2px)';
        btnPermisos.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.2)';
      });
      btnPermisos.addEventListener('mouseleave', () => {
        btnPermisos.style.transform = 'translateY(0)';
        btnPermisos.style.boxShadow = 'none';
      });
      btnPermisos.addEventListener('click', async ()=>{
        const handle = await getHandle();
        if(!handle){
          alert('Primero selecciona un archivo usando el botón superior.');
          return;
        }
        try{
          const perm = await handle.requestPermission({ mode: 'readwrite' });
          if(perm === 'granted'){
            alert('✅ Permisos concedidos. El archivo está listo para sincronización.');
          } else {
            showPermissionInstructions();
          }
        }catch(e){
          console.error('Error verificando permisos:', e);
          showPermissionInstructions();
        }
      });

      // Orden: Disco Local, Archivo Local, Gestionar Permisos
      wrapper.appendChild(btnLocal);
      wrapper.appendChild(btnSelect);
      wrapper.appendChild(btnPermisos);
      document.body.appendChild(wrapper);
    }catch(e){ /* ignore */ }
  }

  // Intentar auto-inject si API disponible
  document.addEventListener('DOMContentLoaded', async ()=>{
    if(window.showSaveFilePicker && typeof indexedDB !== 'undefined'){
      // Verificar si hay servidor disponible
      let showButtons = true;
      try {
        const response = await fetch('http://localhost:3000/tipificaciones', { method: 'GET', cache: 'no-store' });
        if (response.ok) {
          showButtons = false; // Si servidor ok, no mostrar botones
        }
      } catch (e) {
        // Servidor no disponible, mostrar botones
      }

      if (showButtons && document.title !== 'Registros') {
        injectButtons();
        injectLocalOnlyButton();
      }

      // si ya tenemos handle, intentar leerlo
      const handle = await getHandle();
      if(handle){ try{ await window.fsSyncRegistros(); }catch(e){} }
    } else {
      // Si no hay soporte para File System Access, mostrar mensaje alternativo
      console.info('[fs] File System Access API no soportada en este navegador');
      // Podríamos mostrar un mensaje aquí, pero por ahora solo log
    }
  });

})();
