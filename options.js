// options.js — centraliza las opciones de datalist/select en localStorage y permite sincronización
(function(){
  const LS_KEY = 'suic_options';

  // Intento de carga automática del archivo suic_password.json si está disponible
  async function loadPasswordFile(){
    // Si ya fue definida manualmente antes, no sobrescribirla
    if(window.SUICPassword) return;
    try{
      const res = await fetch('./suic_password.json', {cache: 'no-store'});
      if(!res.ok) return;
      const j = await res.json();
      if(j && typeof j === 'object') window.SUICPassword = j;
    }catch(e){ /* ignore */ }
  }

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
    getAll: ()=> getStored() || {},
    saveAll: (obj)=>{ setStored(obj); try{ window.dispatchEvent(new Event('suic_options:updated')); }catch(e){} }
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

  // run on DOM ready
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', async ()=>{ await loadPasswordFile(); init(); });
  else (async ()=>{ await loadPasswordFile(); init(); })();

})();
