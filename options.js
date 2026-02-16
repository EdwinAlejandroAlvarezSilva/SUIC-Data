// options.js — centraliza las opciones de datalist/select en localStorage y permite sincronización
(function(){
  const LS_KEY = 'suic_options';

  // Asegurar que los datos de contraseña estén disponibles (incrustados o desde IndexedDB)
  async function ensurePasswordData(){
    // Si ya están incrustados, usarlos directamente
    if(window.suicPasswordData && window.suicPasswordData.salt && window.suicPasswordData.hash){
      window.SUICPassword = window.suicPasswordData;
      console.log('✅ Datos de contraseña usando variable incrustada');
      return;
    }
    
    // Si no, intentar IndexedDB como fallback
    try{
      const db = await new Promise((resolve, reject)=>{
        const req = indexedDB.open('SUIC', 1);
        req.onerror = ()=>reject(req.error);
        req.onsuccess = ()=>resolve(req.result);
        req.onupgradeneeded = (e)=>{
          const db = e.target.result;
          if(!db.objectStoreNames.contains('passwordData')) db.createObjectStore('passwordData');
        };
      });
      
      const tx = db.transaction('passwordData', 'readonly');
      const store = tx.objectStore('passwordData');
      const data = await new Promise((resolve)=>{
        const req = store.get('current');
        req.onsuccess = ()=>resolve(req.result);
        req.onerror = ()=>resolve(null);
      });
      
      if(data && data.salt && data.hash){
        window.SUICPassword = data;
        console.log('✅ Datos de contraseña desde IndexedDB');
      }
    }catch(e){ 
      console.warn('Error cargando desde IndexedDB:', e);
    }
  }

  // Convierte base64 a Uint8Array
  function b64ToBytes(b64){
    const bin = atob(b64.replace(/\s+/g,''));
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for(let i=0;i<len;i++) bytes[i]=bin.charCodeAt(i);
    return bytes;
  }

  function bytesToB64(bytes){
    let s='';
    for(let i=0;i<bytes.length;i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  async function derivePasswordHash(password, saltB64, iterations){
    const pwUtf8 = new TextEncoder().encode(password);
    const key = await crypto.subtle.importKey('raw', pwUtf8, {name: 'PBKDF2'}, false, ['deriveBits']);
    const salt = b64ToBytes(saltB64);
    // derive 256 bits (32 bytes) — matches common PBKDF2-SHA256 use
    const derived = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations, hash: 'SHA-256'}, key, 256);
    return bytesToB64(new Uint8Array(derived));
  }

  // Valida contraseña - Intenta cargar archivo fresco PRIMERO
  async function validatePassword(plaintext){
    try{
      let pwd = null;

      // Intentar cargar el archivo fresco PRIMERO (sin caché)
      try {
        const freshData = await fetch('./suic_password.json?t=' + Date.now() + '&v=' + Math.random(), {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });
        if (freshData.ok) {
          pwd = await freshData.json();
          console.log('✅ Archivo suic_password.json cargado FRESCO desde el sistema');
        }
      } catch(e) {
        console.warn('⚠️ No se pudo cargar el archivo fresco (normal en file://), usando fallback');
      }

      // Fallback: usar datos incrustados o SUICPassword
      if (!pwd) {
        pwd = window.suicPasswordData || window.SUICPassword;
      }
      
      if(!pwd || !pwd.salt || !pwd.hash) return false;

      // Derivar hash PBKDF2-SHA256
      const textEncoder = new TextEncoder();
      const data = textEncoder.encode(plaintext);
      const saltBinary = atob(pwd.salt);
      const saltData = new Uint8Array(saltBinary.length);
      for(let i = 0; i < saltBinary.length; i++){
        saltData[i] = saltBinary.charCodeAt(i);
      }
      
      const key = await crypto.subtle.importKey('raw', data, {name: 'PBKDF2'}, false, ['deriveBits']);
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2', 
          salt: saltData, 
          iterations: pwd.iterations || 150000, 
          hash: 'SHA-256'
        }, 
        key, 
        256
      );
      
      const derivedArray = Array.from(new Uint8Array(derivedBits));
      
      // Decodificar el hash esperado a bytes para comparación exacta (ignora padding)
      const expectedHashBinary = atob(pwd.hash);
      const expectedHashBytes = Array.from(expectedHashBinary).map(c => c.charCodeAt(0));

      // Comparar byte a byte
      return derivedArray.length === expectedHashBytes.length && 
             derivedArray.every((byte, i) => byte === expectedHashBytes[i]);
    }catch(e){ 
      console.error('validatePassword error:', e);
      return false; 
    }
  }

  // Asegura que el usuario haya validado la contraseña en este navegador; si no, pide entrada UNA VEZ.
  async function ensurePasswordValidated(){
    if(!window.SUICPassword) return true;
    try{
      const stored = localStorage.getItem('suic_password_validated_hash');
      // Cargar fresco para comparar
      let pwd = null;
      const rutas = ['./suic_password.json?t=' + Date.now(), '/suic_password.json?t=' + Date.now(), './SUIC%20Data/suic_password.json?t=' + Date.now()];
      
      for(const ruta of rutas){
        try{ 
          const resp = await fetch(ruta, {cache: 'no-store', headers: {'Pragma': 'no-cache', 'Cache-Control': 'no-cache, no-store, must-revalidate'}});
          if(resp && resp.ok){ 
            pwd = await resp.json();
            if(pwd && pwd.hash) break;
          }
        }catch(e){}
      }
      
      if(pwd && stored && stored === pwd.hash) return true;
      
      // Pedir la contraseña UNA VEZ
      const p = prompt('Ingrese su contraseña para validar acceso:');
      if(p === null) return false;
      
      const ok = await validatePassword(p);
      if(ok){
        if(pwd) localStorage.setItem('suic_password_validated_hash', pwd.hash);
        return true;
      }else{
        alert('❌ Contraseña incorrecta.');
        return false;
      }
    }catch(e){ 
      console.error('Error en ensurePasswordValidated:', e);
      return false;
    }
  }
  
  // Función interna de reseteo (sin el sufijo window.)
  function collectDefaults(){
    const result = {};
    // datalist elements
    document.querySelectorAll('datalist, select').forEach(el=>{
      if(!el.id) return;
      const arr = [];
      if(el.tagName.toLowerCase() === 'datalist'){
        el.querySelectorAll('option').forEach(o=>{ if(o.value!==undefined) arr.push(String(o.value)); });
      } else if(el.tagName.toLowerCase() === 'select'){
        el.querySelectorAll('option').forEach(o=>{ arr.push(o.value || o.textContent || ''); });
      }
      result[el.id] = arr;
    });
    return result;
  }

  function getStored(){
    try{ const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null }catch(e){ return null }
  }

  function setStored(obj){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(obj||{})); }catch(e){}
  }

  function applyOptions(obj){
    if(!obj) return;
    Object.keys(obj).forEach(id=>{
      try{
        const el = document.getElementById(id);
        if(!el) return;
        const items = Array.isArray(obj[id]) ? obj[id] : [];
        if(el.tagName.toLowerCase() === 'datalist'){
          el.innerHTML = '';
          items.forEach(v=>{ const opt = document.createElement('option'); opt.value = v; el.appendChild(opt); });
        } else if(el.tagName.toLowerCase() === 'select'){
          // preserve a placeholder option if it existed (value == '')
          const hadPlaceholder = Array.from(el.options).some(o=>o.value==='');
          el.innerHTML = '';
          if(hadPlaceholder) el.appendChild(new Option('',''));
          items.forEach(v=>{ const o = new Option(v, v); el.appendChild(o); });
        }
      }catch(e){}
    });
  }

  // initialize: if no stored options, collect defaults from the page and store them
  function init(){
    // Asegurar que los datos de contraseña estén disponibles
    ensurePasswordData().catch(e => console.warn('Error loading password data:', e));
    
    const stored = getStored();
    if(!stored){
      const defs = collectDefaults();
      setStored(defs);
      applyOptions(defs);
      return;
    }
    // apply stored to page
    applyOptions(stored);
  }

  // listen storage events to apply changes from other tabs/pages
  window.addEventListener('storage', (e)=>{
    if(e.key === LS_KEY){
      try{ const obj = e.newValue ? JSON.parse(e.newValue) : {}; applyOptions(obj); }catch(err){}
    }
  });

  // expose small API for Opciones.html
  window.SUICOptions = {
    init: ()=> init(),
    getAll: ()=> getStored() || {},
    saveAll: (obj)=>{ setStored(obj); try{ applyOptions(obj); }catch(e){} try{ window.dispatchEvent(new Event('suic_options:updated')); }catch(e){} },
    // aplicar las opciones al DOM de la página actual
    applyAll: ()=>{ try{ const obj = getStored() || {}; applyOptions(obj); }catch(e){} }
  };

  // Password utilities: obtener/establecer los datos de contraseña y descargar/exportar
  window.SUICOptions.getPasswordData = ()=> window.SUICPassword || null;
  window.SUICOptions.setPasswordData = (obj)=>{ window.SUICPassword = obj; };
  window.SUICOptions.downloadPasswordFile = (filename='suic_password.json')=>{
    try{
      const data = window.SUICPassword || {};
      const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }catch(e){}
  };

  // Validación pública: devuelve true/false
  window.SUICOptions.validatePassword = async (plaintext)=> await validatePassword(plaintext);
  // Asegura validación interactiva: muestra prompt si es necesario y devuelve true/false
  window.SUICOptions.ensureValidated = async ()=> await ensurePasswordValidated();
  
  // Exportar Configuración (header + opciones)
  window.SUICOptions.exportConfig = async function(){
    try{
      const headerConfig = localStorage.getItem('suic_header_config');
      const optionsConfig = localStorage.getItem('suic_options');
      const exportData = {
        timestamp: new Date().toISOString(),
        headerConfig: headerConfig ? JSON.parse(headerConfig) : null,
        optionsConfig: optionsConfig ? JSON.parse(optionsConfig) : null
      };
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suic_config_backup_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('✅ Configuración exportada correctamente. Guarda este archivo en un lugar seguro.');
    }catch(e){ console.error(e); alert('❌ Error al exportar configuración: ' + e.message); }
  };
  
  // Importar Configuración (header + opciones)
  window.SUICOptions.importConfig = async function(){
    try{
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e)=>{
        try{
          const file = e.target.files[0];
          if(!file) return;
          const text = await file.text();
          const data = JSON.parse(text);
          if(!data.headerConfig && !data.optionsConfig){ alert('Archivo de configuración inválido'); return; }
          if(data.headerConfig){ localStorage.setItem('suic_header_config', JSON.stringify(data.headerConfig)); }
          if(data.optionsConfig){ localStorage.setItem('suic_options', JSON.stringify(data.optionsConfig)); }
          alert('✅ Configuración importada correctamente. Actualiza la página.');
          setTimeout(()=>{ location.reload(); }, 500);
        }catch(e){ console.error(e); alert('❌ Error al importar archivo: ' + e.message); }
      };
      input.click();
    }catch(e){ console.error(e); alert('❌ Error al iniciar importación: ' + e.message); }
  };
  
  // Exportar Contraseña
  window.SUICOptions.exportPassword = async function(){
    try{
      const data = window.SUICPassword || {};
      if(!data.salt || !data.hash){ alert('No hay contraseña configurada'); return; }
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suic_password_backup_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('✅ Contraseña exportada correctamente. Guarda este archivo en un lugar seguro.');
    }catch(e){ console.error(e); alert('❌ Error al exportar contraseña: ' + e.message); }
  };

  // Refrescar Contraseña: limpia IndexedDB+localStorage y recarga desde archivo suic_password.json
  window.SUICOptions.refreshPassword = async function(){
    try{
      // 1. Limpiar localStorage (sesión validada)
      try{
        localStorage.removeItem('suic_password_validated_hash');
      }catch(e){}

      // 2. Limpiar IndexedDB completamente
      try{
        const db = await new Promise((resolve, reject)=>{
          const req = indexedDB.open('SUIC', 1);
          req.onerror = ()=>reject(req.error);
          req.onsuccess = ()=>resolve(req.result);
          req.onupgradeneeded = (e)=>{
            const db = e.target.result;
            if(!db.objectStoreNames.contains('passwordData')) db.createObjectStore('passwordData');
          };
        });
        
        const tx = db.transaction('passwordData', 'readwrite');
        const store = tx.objectStore('passwordData');
        
        // Limpiar todos los registros
        await new Promise((resolve)=>{
          const req = store.clear();
          req.onsuccess = ()=>resolve();
          req.onerror = ()=>resolve();
        });
        
        db.close();
      }catch(e){
        console.warn('Error limpiando IndexedDB:', e);
      }

      // 3. Limpiar memoria
      window.SUICPassword = null;
      
      // 4. Recargar desde archivo suic_password.json con múltiples intentos de ruta
      let res = null;
      const rutas = [
        './suic_password.json?t=' + Date.now(),
        '/suic_password.json?t=' + Date.now(),
        './SUIC%20Data/suic_password.json?t=' + Date.now()
      ];
      
      for(const ruta of rutas){
        try{
          res = await fetch(ruta, {
            cache: 'no-store',
            headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache, no-store, must-revalidate' }
          });
          if(res && res.ok) break;
        }catch(e){
          console.warn('Intento fallido con ruta:', ruta, e);
        }
      }
      
      if(!res || !res.ok){
        throw new Error('No se pudo cargar suic_password.json desde ninguna ruta');
      }
      
      const j = await res.json();
      if(j && typeof j === 'object' && j.salt && j.hash){
        window.SUICPassword = j;
        alert('✅ Contraseña refrescada correctamente desde suic_password.json.\n\nDeberás volver a ingresar con la nueva contraseña.');
      }else{
        throw new Error('Archivo suic_password.json inválido o incompleto');
      }
    }catch(e){ 
      console.error('refreshPassword error:', e); 
      alert('❌ Error al refrescar contraseña:\n' + (e.message || String(e)) + '\n\nAsegúrate de que suic_password.json existe en el directorio raíz.'); 
    }
  };

  // Limpiar Sesión de Contraseña: elimina del localStorage, sessionStorage e IndexedDB
  window.SUICOptions.clearPasswordSession = async function(){
    try{
      // 1. Limpiar localStorage
      try{
        localStorage.removeItem('suic_password_validated_hash');
        localStorage.removeItem('suic_password');
        localStorage.removeItem('suic_auth');
      }catch(e){}

      // 2. Limpiar sessionStorage
      try{
        sessionStorage.removeItem('suic_password_validated_hash');
        sessionStorage.removeItem('suic_password');
        sessionStorage.removeItem('suic_auth');
      }catch(e){}

      // 3. Limpiar IndexedDB
      try{
        const db = await new Promise((resolve, reject)=>{
          const req = indexedDB.open('SUIC', 1);
          req.onerror = ()=>reject(req.error);
          req.onsuccess = ()=>resolve(req.result);
          req.onupgradeneeded = (e)=>{
            const db = e.target.result;
            if(!db.objectStoreNames.contains('passwordData')) db.createObjectStore('passwordData');
          };
        });
        
        const tx = db.transaction('passwordData', 'readwrite');
        const store = tx.objectStore('passwordData');
        await new Promise((resolve)=>{
          const req = store.clear();
          req.onsuccess = ()=>resolve();
          req.onerror = ()=>resolve();
        });
        db.close();
      }catch(e){
        console.warn('Error limpiando IndexedDB:', e);
      }

      // 4. Limpiar memoria
      window.SUICPassword = null;

      alert('✅ Sesión de contraseña limpiada completamente.\n\nLa próxima vez tendrá que ingresar su contraseña nuevamente.');
    }catch(e){ 
      console.error(e); 
      alert('❌ Error al limpiar sesión: ' + e.message); 
    }
  };

  // run on DOM ready
  // Carga contraseña
  // En Opciones.html: solo carga contraseña, init() se llama después de validación
  // En otras páginas: carga contraseña + aplica opciones ANTES de que el código las use
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async ()=>{ 
      await ensurePasswordData(); 
      // Si NO es Opciones.html, aplicar opciones automáticamente
      if(!window.location.pathname.includes('Opciones')) {
        init();
      }
    });
  } else {
    (async ()=>{ 
      await ensurePasswordData(); 
      if(!window.location.pathname.includes('Opciones')) {
        init();
      }
    })();
  }

})();
