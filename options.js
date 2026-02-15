// options.js — centraliza las opciones de datalist/select en localStorage y permite sincronización
(function(){
  const LS_KEY = 'suic_options';

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

  // run on DOM ready
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
