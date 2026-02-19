// Cronómetro (contador incremental) en formato HH:MM:SS
// Comportamiento:
// - Inicia o continúa cuando se selecciona 'En proceso' (inicio) o 'Continuar' (final)
// - Se pausa cuando se selecciona 'En pausa', 'Reasignado' o 'Finalizado'
let _chronInterval = null;
let _elapsedSeconds = 0; // segundos acumulados en pausas previas
let _running = false;
let _lastStartTs = null; // timestamp ms cuando se inició la última vez
// Previene que el cronómetro se inicie automáticamente después de un autoguardado
let _preventCronoAutoStart = false;

function _formatHHMMSS(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function _updateChronDisplay() {
  const span = document.getElementById('diferencia-horas');
  if (!span) return;
  let total = _elapsedSeconds;
  if (_running && _lastStartTs) {
    total += Math.floor((Date.now() - _lastStartTs) / 1000);
  }
  span.textContent = `Tiempo: ${_formatHHMMSS(total)}`;
}

function _startChrono(force=false) {
  // Si hay un bloqueo activo y no se solicita forzar, no iniciar automáticamente
  if (_preventCronoAutoStart && !force) return;
  if (_running) return;
  _running = true;
  _lastStartTs = Date.now();
  if (!_chronInterval) {
    _chronInterval = setInterval(_updateChronDisplay, 1000);
  }
  _updateChronDisplay();
}

function _pauseChrono() {
  if (!_running) return;
  // acumular el tiempo transcurrido desde la última reanudación
  _elapsedSeconds += Math.floor((Date.now() - _lastStartTs) / 1000);
  _running = false;
  _lastStartTs = null;
  _updateChronDisplay();
  _handlePausedChronoDisplay();
}

// Guardar/mostrar valor final del cronómetro en la UI y en localStorage
function _handlePausedChronoDisplay() {
  try {
    let total = _elapsedSeconds || 0;
    // si está pausado no sumar nada extra; si estuviera corriendo se sumaría en _updateChronDisplay
    const cronometroStr = (function (s) {
      const hrs = Math.floor(s / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = Math.floor(s % 60);
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    })(total);

    // Actualizar un input/elemento visible si existe (evita sobrescribir campos de 'tiempo' que son etiquetas)
    const elCron = document.getElementById('tiempo_cronometro') || document.getElementById('cronometro');
    if (elCron) {
      if (elCron.tagName === 'INPUT' || elCron.tagName === 'TEXTAREA') elCron.value = cronometroStr;
      else elCron.textContent = cronometroStr;
    }

    // Guardar respaldo en localStorage
    try { localStorage.setItem('last_cronometro', cronometroStr); } catch (e) { /* ignore */ }
  } catch (e) { /* ignore */ }
}

function _resetChrono() {
  if (_chronInterval) {
    clearInterval(_chronInterval);
    _chronInterval = null;
  }
  _elapsedSeconds = 0;
  _running = false;
  _lastStartTs = null;
  _updateChronDisplay();
}

// --- Persistencia de borrador (autosave) para evitar pérdida de datos ---
const DRAFT_KEY = 'suic_draft';

// Clave para la preferencia del autoborrador
const AUTODELETE_KEY = 'autodelete_enabled';

function isAutodeleteEnabled(){
  try{ return localStorage.getItem(AUTODELETE_KEY) === '1' }catch(e){ return false }
}

function setAutodeleteEnabled(v){
  try{ localStorage.setItem(AUTODELETE_KEY, v ? '1' : '0') }catch(e){}
}

function updateAutodelBtn(){
  const btn = document.getElementById('toggle-autodelete');
  const ico = document.getElementById('autodel-icon');
  if(!btn) return;
  const enabled = isAutodeleteEnabled();
  if(enabled){
    btn.classList.add('active');
    btn.title = 'Autoborrador: activado';
    if(ico) ico.textContent = '🗑️';
  } else {
    btn.classList.remove('active');
    btn.title = 'Autoborrador: desactivado';
    if(ico) ico.textContent = '🧾';
  }
}

// Inicializar control del autoborrador en DOMContentLoaded
document.addEventListener('DOMContentLoaded', ()=>{
  try{
    updateAutodelBtn();
    const btn = document.getElementById('toggle-autodelete');
    if(btn){
      btn.addEventListener('click', ()=>{
        const cur = isAutodeleteEnabled();
        // Guardar estado actual del cronómetro inmediatamente para evitar pérdida
        try {
          // calcular tiempo total acumulado en segundos
          let total = _elapsedSeconds || 0;
          if (_running && _lastStartTs) {
            total += Math.floor((Date.now() - _lastStartTs) / 1000);
          }
          // guardar representación legible y valor en segundos (por si se necesita)
          try { localStorage.setItem('last_cronometro', _formatHHMMSS(total)); } catch (e) { }
          try { localStorage.setItem('last_cronometro_seconds', String(total)); } catch (e) { }
          // También hacer un guardado rápido del borrador (respaldo)
          try { _saveDraft(); } catch (e) { }
        } catch (e) { /* ignore */ }

        // Alternar preferencia
        setAutodeleteEnabled(!cur);
        updateAutodelBtn();

        // Si activan el autoborrador y existe un borrador, eliminarlo inmediatamente
        // (con el respaldo anterior en localStorage no se perderá el cronómetro)
        if(!cur){ try{ localStorage.removeItem(DRAFT_KEY); }catch(e){} }
      });
    }
  }catch(e){}
});

function _serializeFormFields() {
  const data = {};
  const elementos = document.querySelectorAll('input, textarea, select');
  elementos.forEach(el => {
    try {
      if (!el.id) return;
      if (el.tagName === 'SELECT') data[el.id] = { type: 'select', selectedIndex: el.selectedIndex };
      else data[el.id] = { type: 'input', value: el.value };
    } catch (e) { /* ignore */ }
  });
  return data;
}

function _applySerializedFields(data) {
  if (!data || typeof data !== 'object') return;
  Object.keys(data).forEach(id => {
    try {
      const el = document.getElementById(id);
      if (!el) return;
      const info = data[id];
      if (!info) return;
      if (info.type === 'select' && typeof info.selectedIndex === 'number') el.selectedIndex = info.selectedIndex;
      else if (info.type === 'input') el.value = info.value || '';
    } catch (e) { /* ignore missing elements */ }
  });
}

function _saveDraft() {
  try {
    // Calcular el tiempo total tal como debería verse en el momento del guardado.
    // Si el cronómetro está corriendo, incluir el tiempo transcurrido desde la
    // última reanudación (_lastStartTs). De este modo, al restaurar el borrador
    // se recupera el tiempo exacto mostrado al usuario cuando se guardó.
    let totalSeconds = _elapsedSeconds || 0;
    if (_running && _lastStartTs) {
      totalSeconds += Math.floor((Date.now() - _lastStartTs) / 1000);
    }

    const draft = {
      timestamp: Date.now(),
      fields: _serializeFormFields(),
      chrono: {
        elapsedSeconds: totalSeconds,
        running: _running,
        lastStartTs: _lastStartTs
      }
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) { /* ignore storage errors */ }
}

function _clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
}

function _restoreDraftPrompt() {
  try {
    // Evitar mostrar dialogos (confirm) cuando la pestaña no está activa
    if (typeof document !== 'undefined' && document.hidden) {
      try {
        // Reintentar al recuperar el foco de la ventana
        const onFocus = function() {
          try { window.removeEventListener('focus', onFocus); } catch(e){}
          try { _restoreDraftPrompt(); } catch(e){}
        };
        window.addEventListener('focus', onFocus);
      } catch(e){}
      return;
    }
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (!draft) return;
    // Si el autoborrador está activado, borramos el borrador sin preguntar
    if (isAutodeleteEnabled()){
      try{ localStorage.removeItem(DRAFT_KEY); }catch(e){}
      return;
    }
    // Preguntar al usuario si desea restaurar el borrador
    const ok = confirm('Se encontró un borrador no guardado. ¿Deseas restaurarlo para continuar?');
    if (!ok) return;
    // Restaurar campos
    _applySerializedFields(draft.fields);

    // Si el borrador incluía un valor para 'tiempo', marcarlo como editado manualmente
    try {
      const hasTiempo = draft.fields && draft.fields['tiempo'] && String(draft.fields['tiempo'].value || '').trim() !== '';
      if (hasTiempo) {
        const tEl = document.getElementById('tiempo');
        if (tEl) tEl.dataset.manual = 'true';
      }
    } catch (e) { /* ignore */ }

    // Si el borrador contenía valores para 'Cant Escuelas' o 'Cant Candidatos',
    // mostrar explícitamente el wrapper de 'Competencias' para que los campos sean visibles
    // incluso si el selector de categoría no los estaría mostrando por sí solo.
    try {
      const hasCe = draft.fields && draft.fields['cant-escuelas'] && String(draft.fields['cant-escuelas'].value || '').trim() !== '';
      const hasCc = draft.fields && draft.fields['cant-candidatos'] && String(draft.fields['cant-candidatos'].value || '').trim() !== '';
      const tcField = draft.fields && draft.fields['tipos-canales'];
      const hasTc = tcField && ((tcField.type === 'input' && String(tcField.value || '').trim() !== '') || (tcField.type === 'select' && typeof tcField.selectedIndex === 'number' && tcField.selectedIndex > 0));
      const wrapper = document.getElementById('competencias-fields');
      const cat = document.getElementById('categoria');
      // Primero, disparar evento 'input' en categoría para aplicar la lógica normal de visibilidad
      if (cat) cat.dispatchEvent(new Event('input', { bubbles: true }));
      // Si el borrador tiene datos en los campos de competencias, forzar visibilidad del wrapper
      if ((hasCe || hasCc || hasTc) && wrapper && wrapper.style.display === 'none') {
        wrapper.style.display = 'grid';
        wrapper.setAttribute('aria-hidden', 'false');
      }
    } catch (e) { /* ignore */ }

    // Restaurar cronómetro
    try {
      if (draft.chrono) {
        // Recuperar valores guardados
        const storedElapsed = Number(draft.chrono.elapsedSeconds) || 0;
        const wasRunning = !!draft.chrono.running;
        const storedLast = draft.chrono.lastStartTs ? Number(draft.chrono.lastStartTs) : null;

        // Restaurar sólo el tiempo exacto guardado (sin sumar el tiempo transcurrido
        // entre el momento del guardado y la apertura de la página). En todos los
        // casos dejamos el cronómetro en pausa para que el usuario decida si
        // desea reanudarlo manualmente.
        _elapsedSeconds = storedElapsed;
        _running = false;
        _lastStartTs = null;

        // Actualizar la UI con el tiempo acumulado (detenido)
        _updateChronDisplay();
      }
    } catch (e) { _updateChronDisplay(); }
  } catch (e) { /* ignore parse errors */ }
}

// Auto-guardar periódicamente y al descargar/cerrar la página
try {
  // Guardar cada 5 segundos
  setInterval(_saveDraft, 5000);
  window.addEventListener('beforeunload', _saveDraft);
  // También guardar cuando la pestaña queda oculta (opcional)
  document.addEventListener('visibilitychange', () => { if (document.hidden) _saveDraft(); });
} catch (e) { /* ignore environment limitations */ }

// Inicializar pantalla
document.addEventListener('DOMContentLoaded', _updateChronDisplay);

/* Auto-guardado por tiempo eliminado por petición del usuario. */
try{ localStorage.removeItem('suic_autosave_settings'); }catch(e){}


// Permitir que re-seleccionar la misma opción en los selects 'inicio'/'final' ejecute la lógica
document.addEventListener('DOMContentLoaded', () => {
  try {
    const selIni = document.getElementById('inicio');
    const selFin = document.getElementById('final');
    if (selIni) {
      selIni.addEventListener('click', () => {
        // Delay pequeño para esperar la selección del usuario en navegadores que actualizan value después
        setTimeout(() => {
          const v = selIni.value || '';
          if (v !== '') colocarHora('inicio');
        }, 150);
      });
    }
    if (selFin) {
      selFin.addEventListener('click', () => {
        setTimeout(() => {
          const v = selFin.value || '';
          if (v !== '') colocarHora('final');
        }, 150);
      });
    }
  } catch (e) { /* ignore */ }
});

// Los cambios en los selects controlan el cronómetro mediante colocarHora
// (no dependemos de cambios manuales en los inputs de hora)
let registros = [];

// Restaurar datos desde el almacenamiento (archivo/servidor) cuando se carga la página
// El archivo es la fuente de verdad; localStorage es backup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (typeof window.loadRegistrosFromStorage === 'function') {
      const loaded = await window.loadRegistrosFromStorage();
      if (Array.isArray(loaded) && loaded.length > 0) {
        registros = loaded;
        console.info('[codigo.js] - registros restaurados desde almacenamiento:', registros.length, 'elementos');
      }
    }
  } catch (e) {
    console.error('[codigo.js] - error restaurando registros:', e);
  }
});

// Evento adicional: actualizar registros si el servidor tiene datos más nuevos
window.addEventListener('registros:loaded', (evt) => {
  try {
    const { registros: newRegistros, count } = evt.detail || {};
    if (Array.isArray(newRegistros) && newRegistros.length > 0) {
      registros = newRegistros;
      console.info('[codigo.js] - registros actualizados desde servidor:', count, 'elementos');
    }
  } catch (e) { /* ignore */ }
});

setInterval(() => {
  localStorage.setItem("registros", JSON.stringify(registros));
  try{ if(typeof window.syncRegistros === 'function') window.syncRegistros(registros); }catch(e){}
}, 300000); // Guarda cada 5 minutos

function guardarFormulario(isAuto=false) {
  const campos = [
    "hora-inicio", "inicio", "hora-final", "final", "nombre", "acciones", "detalle",
    "fallas", "descripcion", "comentarios", "tiempo", "actualizado", "documentos",
    "categoria", "analista", "documento", "asignado", "prioridad"
  ];

  // Helper: validar campos requeridos reutilizable
    // Intentar autocomentar antes de validar (función global definida fuera)
    try { if (typeof _autoCommentForCompetencias === 'function') _autoCommentForCompetencias(); } catch (e) { /* ignore */ }
  function _validateRequiredFields() {
    const opcionales = ["fallas", "descripcion", "comentarios"];
    let faltantes = [];
    campos.forEach(id => {
      if (opcionales.includes(id)) return;
      const el = document.getElementById(id);
      let valor = "";
      if (!el) return faltantes.push(id);
      if (el.tagName === "SELECT") {
        valor = el.options[el.selectedIndex]?.value || "";
      } else {
        valor = el.value || "";
      }
      if (!valor) faltantes.push(id);
    });

    // Validación adicional: si Categoría = Competencias y los campos aparecen, exigir Cant Escuelas/Cant Candidatos
    try {
      const cat = document.getElementById('categoria');
      const wrapper = document.getElementById('competencias-fields');
      const isVisible = wrapper && window.getComputedStyle(wrapper).display !== 'none';
      const catVal = (cat && (cat.value || '').trim().toLowerCase()) || '';
      if (catVal === 'competencias' && isVisible) {
        const ce = document.getElementById('cant-escuelas');
        const cc = document.getElementById('cant-candidatos');
        const tc = document.getElementById('tipos-canales');
        const ceEmpty = !ce || String(ce.value || '').trim() === '';
        const ccEmpty = !cc || String(cc.value || '').trim() === '';
        const tcEmpty = !tc || String(tc.value || '').trim() === '';
        if (ceEmpty) faltantes.push('cant-escuelas');
        if (ccEmpty) faltantes.push('cant-candidatos');
        if (tcEmpty) faltantes.push('tipos-canales');
      }
    } catch (e) { /* ignore */ }

    return { ok: faltantes.length === 0, missing: faltantes };
  }

  const opcionales = ["fallas", "descripcion", "comentarios"];

  // Validar que todos los campos requeridos estén llenos
  const validation = _validateRequiredFields();
  if (!validation.ok) {
    if (isAuto) {
      // En caso de auto-guardado fallido, pausar cronómetro y notificar
      try { _pauseChrono(); } catch (e) {}
      alert('No se puede autoguardar: faltan campos obligatorios. Por favor completa todos los campos antes de intentar el guardado automático.');
      return;
    }
    alert("Debes rellenar todos los datos obligatorios antes de guardar.");
    return;
  }

  // Si la categoría es 'Competencias' y los campos de Competencias están visibles,
  // exigir que Cant Escuelas y Cant Candidatos no estén vacíos.
  try {
    const cat = document.getElementById('categoria');
    const wrapper = document.getElementById('competencias-fields');
    const isVisible = wrapper && window.getComputedStyle(wrapper).display !== 'none';
    const catVal = (cat && (cat.value || '').trim().toLowerCase()) || '';
    if (catVal === 'competencias' && isVisible) {
      const ce = document.getElementById('cant-escuelas');
      const cc = document.getElementById('cant-candidatos');
      const ceEmpty = !ce || String(ce.value || '').trim() === '';
      const ccEmpty = !cc || String(cc.value || '').trim() === '';
      if (ceEmpty || ccEmpty) {
        alert("Para la categoría 'Competencias' debes completar 'Cant Escuelas' y 'Cant Candidatos' antes de guardar.");
        return;
      }
    }
  } catch (e) { /* ignore */ }

  // Si todo está bien, guardar
  const registro = campos.map(id => {
    const el = document.getElementById(id);
    if (!el) return "";
    if (el.tagName === "SELECT") {
      return el.options[el.selectedIndex]?.text || "";
    }
    return el.value || "";
  });

  /* Auto-guardado por tiempo eliminado: no se aplican estados automáticos. */

  // Añadir al final el valor actual del cronómetro en formato HH:MM:SS
  try {
    let total = _elapsedSeconds || 0;
    if (_running && _lastStartTs) {
      total += Math.floor((Date.now() - _lastStartTs) / 1000);
    }
    const cronometroStr = _formatHHMMSS(total);
    // Reservar columna 'Actualizado' (vacía en creación) y luego añadir cronómetro
    registro.push('');
    registro.push(cronometroStr);
    // Añadir al final Cant Escuelas, Cant Candidatos y Tipos de Canales (guardar si existen o vacío si no)
    try{
      const ce = document.getElementById('cant-escuelas');
      const cc = document.getElementById('cant-candidatos');
      const tc = document.getElementById('tipos-canales');
      const valCe = ce && ce.value !== '' ? Number(ce.value) : '';
      const valCc = cc && cc.value !== '' ? Number(cc.value) : '';
      const valTc = tc && tc.value ? tc.value : '';
      registro.push(valCe);
      registro.push(valCc);
      registro.push(valTc);
    }catch(e){ registro.push(''); registro.push(''); registro.push(''); }
  } catch (e) {
    // Si algo falla, no impedir el guardado
    registro.push(''); registro.push(''); registro.push(''); registro.push('');
  }

  registros.push(registro);
  localStorage.setItem("registros", JSON.stringify(registros));
  try{ if(typeof window.syncRegistros === 'function') window.syncRegistros(registros); }catch(e){}
  // Borrar borrador tras guardado exitoso
  try { _clearDraft(); } catch (e) { /* ignore */ }

  document.getElementById("contador-formularios").textContent =
    `🗂️ ${registros.length} Registro${registros.length === 1 ? "" : "s"}`;

  // Resetear formulario y cronómetro al guardar para evitar inconsistencias
  borrarDatos();
  try {
    // En caso de auto-guardado queremos reiniciar el cronómetro a 00:00:00 y dejarlo detenido
    // para comenzar una nueva tipificación limpia.
    _resetChrono();
  } catch (e) { /* ignore */ }

  // Autocompletar valores por defecto después de guardar
  document.getElementById("tiempo").value = "En Línea (1 - 10 minutos)";
  document.getElementById("actualizado").value = "Nuevo";
  document.getElementById("prioridad").value = "Medium";
  var hoy = new Date();
  var yyyy = hoy.getFullYear();
  var mm = String(hoy.getMonth() + 1).padStart(2, '0');
  var dd = String(hoy.getDate()).padStart(2, '0');
  // Campo Fecha de Entrega eliminado: ya no se asigna aquí.
  if (!isAuto) alert("Formulario guardado. Puedes llenar otro.");
}

function descargarTodoCSV() {
  if (registros.length === 0) {
    alert("No hay formularios guardados.");
    return;
  }
  const encabezados = [
    "Inicio", "Estado de Inicio", "Final", "Estado Final", "Nombre", "Acciones",
    "Detalle de Solicitud", "Fallas", "Descripción", "Comentarios", "Tiempo de Gestión",
    "Nuevo o Actualizado", "Cant Documentos", "Categoría", "Analista/Área",
    "Nombre de Documento", "Asignado a", "Prioridad", "Tiempo (cronómetro)", "Cant Escuelas", "Cant Candidatos", "Tipos de Canales"
  ];

  let contenido = encabezados.join(",") + "\n";

  function calcularCronoDesdeFila(fila){
    try{
      const last = fila[fila.length - 1];
      if(last && typeof last === 'string' && /^\d{1,2}:\d{2}:\d{2}$/.test(String(last).trim())) return String(last).trim();
      const parse = (s) => {
        if (!s || typeof s !== 'string') return null;
        const parts = s.split(' ');
        if (parts.length < 2) return null;
        const time = parts[0].split(':').map(Number);
        const date = parts[1].split('/').map(Number);
        if (time.length < 3 || date.length < 3) return null;
        return new Date(date[2], date[1]-1, date[0], time[0], time[1], time[2]);
      };
      const a = parse(fila[0]);
      const b = parse(fila[2]);
      if(a && b){
        const diff = Math.abs(b - a);
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
      }
    }catch(e){ }
    return '';
  }

  registros.forEach(filaOrig => {
    const fila = Array.isArray(filaOrig) ? filaOrig.slice() : [];
    const needed = encabezados.length;
    const timeIndex = encabezados.indexOf('Tiempo (cronómetro)');

    try{
      if (fila.length <= timeIndex) {
        while(fila.length <= timeIndex) fila.push('');
        fila[timeIndex] = calcularCronoDesdeFila(fila);
      } else {
        const cur = fila[timeIndex];
        if(!(typeof cur === 'string' && /^\d{1,2}:\d{2}:\d{2}$/.test(String(cur).trim()))) {
          fila[timeIndex] = calcularCronoDesdeFila(fila);
        }
      }
    }catch(e){ }

    if (fila.length < needed) {
      while(fila.length < needed) fila.push('');
    } else if (fila.length > needed) {
      fila.length = needed;
    }

    const escaped = fila.map(valor => '"' + String(valor || '').replace(/"/g, '""') + '"').join(',');
    contenido += escaped + "\n";
  });

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "SUIC Data.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function colocarHora(tipo) {
  const ahora = new Date();
  const hh = String(ahora.getHours()).padStart(2, '0');
  const mm = String(ahora.getMinutes()).padStart(2, '0');
  const ss = String(ahora.getSeconds()).padStart(2, '0');
  const dd = String(ahora.getDate()).padStart(2, '0');
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const yyyy = ahora.getFullYear();
  const formato = `${hh}:${mm}:${ss} ${dd}/${mes}/${yyyy}`; // HH:MM:SS DD/MM/AAAA

  const valor = document.getElementById(tipo).value;

  // Inicio: si seleccionan 'En proceso' -> iniciar cronómetro y registrar hora inicio si vacío
  if (tipo === 'inicio') {
    if (valor === 'En proceso') {
      // solo setear hora-inicio si está vacío, mantener la primera marca
      const hi = document.getElementById('hora-inicio');
      if (hi && !hi.value) hi.value = formato;
      // Solo iniciar el cronómetro si la acción proviene del usuario (select tiene el foco).
      const sel = document.getElementById('inicio');
      const isUserAction = (document.activeElement === sel);
      if (isUserAction) {
        // Permitir inicio por acción de usuario
        _preventCronoAutoStart = false;
        _startChrono(true);
      }
    } else {
      // cualquier otra selección en inicio no detiene por sí sola el cronómetro
    }
  }

  // Final: controlar cronómetro según selección
  if (tipo === 'final') {
    if (['Continuar', 'En proceso'].includes(valor)) {
      // Continuar/seguir: iniciar o continuar cronómetro
      // Solo iniciar si el cambio es una interacción del usuario (select con foco)
      const sel = document.getElementById('final');
      const isUserAction = (document.activeElement === sel);
      if (isUserAction) {
        _preventCronoAutoStart = false;
        _startChrono(true);
      }
    }

    if (['En pausa', 'Reasignado', 'Finalizado'].includes(valor)) {
      // Pausar cronómetro y fijar hora-final
      _pauseChrono();
      const hf = document.getElementById('hora-final');
      if (hf) hf.value = formato;
    }

    // Si seleccionan 'Continuar' y no hay hora-final previa, no setear hora-final
  }
}

function descargarDatos() {
  // Encabezados exactos solicitados (orden fijo)
  const encabezados = [
    "Inicio", "Estado de Inicio", "Final", "Estado Final", "Nombre", "Acciones",
    "Detalle de Solicitud", "Fallas", "Descripción", "Comentarios", "Tiempo de Gestión",
    "Nuevo o Actualizado", "Cant Documentos", "Categoría", "Analista/Área",
    "Nombre de Documento", "Asignado a", "Prioridad", "Tiempo (cronómetro)", "Cant Escuelas", "Cant Candidatos", "Tipos de Canales"
  ];

  // IDs correspondientes en el formulario (en el mismo orden, excepto la última columna que se calcula)
  const ids = [
    "hora-inicio", "inicio", "hora-final", "final", "nombre", "acciones",
    "detalle", "fallas", "descripcion", "comentarios", "tiempo",
    "actualizado", "documentos", "categoria", "analista", "documento",
    "asignado", "prioridad"
  ];

  const escapeCSV = (s) => '"' + String(s || '').replace(/"/g, '""') + '"';

  const valores = ids.map(id => {
    try {
      const el = document.getElementById(id);
      if (!el) return escapeCSV('');
      if (el.tagName === 'SELECT') return escapeCSV(el.options[el.selectedIndex]?.text || '');
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return escapeCSV(el.value || '');
      return escapeCSV(el.textContent || el.value || '');
    } catch (e) { return escapeCSV(''); }
  });

  // Calcular tiempo del cronómetro al momento de la descarga
  let cronometroStr = '';
  try {
    let total = _elapsedSeconds || 0;
    if (_running && _lastStartTs) {
      total += Math.floor((Date.now() - _lastStartTs) / 1000);
    }
    cronometroStr = _formatHHMMSS(total);
  } catch (e) { cronometroStr = ''; }

  valores.push(escapeCSV(cronometroStr));

  // Incluir Cant Escuelas y Cant Candidatos si existen (sino dejar vacío)
  try{
    const ce = document.getElementById('cant-escuelas');
    const cc = document.getElementById('cant-candidatos');
    const tc = document.getElementById('tipos-canales');
    valores.push(escapeCSV(ce && ce.value !== undefined && ce.value !== null ? ce.value : ''));
    valores.push(escapeCSV(cc && cc.value !== undefined && cc.value !== null ? cc.value : ''));
    valores.push(escapeCSV(tc && tc.value !== undefined && tc.value !== null ? tc.value : ''));
  }catch(e){ valores.push(escapeCSV('')); valores.push(escapeCSV('')); valores.push(escapeCSV('')); }

  const encabezadosCSV = encabezados.map(h => escapeCSV(h)).join(',');
  const contenidoCSV = encabezadosCSV + '\n' + valores.join(',');

  const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "SUIC Data.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function borrarDatos() {
  const elementos = document.querySelectorAll('input, textarea, select');
  elementos.forEach(el => {
    // Omitir los campos: Tiempo de Gestión, Nuevo o Actualizado, Prioridad
    if (el.id === 'tiempo' || el.id === 'actualizado' || el.id === 'prioridad') {
      return;
    }
    if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else if (['text', 'number', 'date'].includes(el.type) || el.tagName === 'TEXTAREA') {
      el.value = '';
    }
  });
  // Asegurar que el cronómetro se muestra en 00:00:00 al limpiar campos
  try { _resetChrono(); } catch (e) { /* ignore */ }

  // Forzar actualización de visibilidad de campos 'Competencias' (si existe handler)
  try{
    // Forzar actualización de visibilidad en el formulario principal
    const cat = document.getElementById('categoria');
    if(cat) cat.dispatchEvent(new Event('input', { bubbles: true }));

    // Limpiar inputs del formulario principal si existen
    const ce = document.getElementById('cant-escuelas');
    const cc = document.getElementById('cant-candidatos');
    const tc = document.getElementById('tipos-canales');
    if(ce) ce.value = '';
    if(cc) cc.value = '';
    if(tc) tc.value = '';

    // Además limpiar los campos del modal de edición en caso de que esté abierto
    const ceEdit = document.getElementById('edit-cant-escuelas');
    const ccEdit = document.getElementById('edit-cant-candidatos');
    const tcEdit = document.getElementById('edit-tipos-canales');
    if(ceEdit) ceEdit.value = '';
    if(ccEdit) ccEdit.value = '';
    if(tcEdit) tcEdit.value = '';

    // Forzar actualización de visibilidad en el modal (si existe)
    const editCat = document.getElementById('edit-categoria');
    if(editCat) editCat.dispatchEvent(new Event('input', { bubbles: true }));
  }catch(e){}
}

window.addEventListener("load", () => {
  const dataGuardada = localStorage.getItem("registros");
  if (dataGuardada) {
    registros = JSON.parse(dataGuardada);
    const contadorEl = document.getElementById("contador-formularios");
    if (contadorEl) {
      contadorEl.textContent = `🗂️ ${registros.length} Registro${registros.length === 1 ? "" : "s"}`;
    }
  }
  // Intentar restaurar borrador (si existe)
  try { _restoreDraftPrompt(); } catch (e) { /* ignore */ }
});

// --- Detección global de palabras clave para comentarios (Competencias) ---
// Normaliza texto (quita diacríticos y pasa a minúsculas)
function _normalizeText(s) {
  try {
    return String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  } catch (e) { return String(s || '').toLowerCase(); }
}

function _escapeRegExp(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Devuelve array de etiquetas encontradas (coincidencia por palabra exacta)
function _detectKeywordsFromText(text) {
  try {
    const normalized = _normalizeText(text);
    const map = {
      'a365': 'A365',
      'concentrix': 'Concentrix',
      'fortel': 'Fortel',
      'gea': 'GEA',
      'mdy': 'MDY',
      'partner': 'Partner',
      'atento peru': 'Atento Perú',
      'bpo peru': 'BPO Perú',
      'grupo recupera': 'Grupo Recupera'
    };
    const found = [];
    Object.keys(map).forEach(key => {
      const k = _normalizeText(key);
      // usar límites de palabra; para multi-palabra también funciona
      const re = new RegExp('\\b' + _escapeRegExp(k) + '\\b', 'i');
      if (re.test(normalized)) {
        const v = map[key]; if (!found.includes(v)) found.push(v);
      }
    });
    return found;
  } catch (e) { return []; }
}

function _getStoredDetectedKeywords() {
  try { return JSON.parse(document.body.dataset.detectedKeywords || '[]'); } catch (e) { return []; }
}

function _storeDetectedKeywords(keys) {
  try { document.body.dataset.detectedKeywords = JSON.stringify(Array.from(new Set(keys || []))); } catch (e) { /* ignore */ }
}

function _applyKeywordsToComments(keys) {
  try {
    if (!Array.isArray(keys) || keys.length === 0) return;
    const comentariosEl = document.getElementById('comentarios');
    if (!comentariosEl) return;
    const actual = (comentariosEl.value || '').split(';').map(s => s.trim()).filter(Boolean);
    keys.forEach(k => { if (!actual.includes(k)) actual.push(k); });
    comentariosEl.value = actual.join('; ');
  } catch (e) { /* ignore */ }
}

// Función pública: detecta y aplica/almacena según la categoría actual.
function _getAllKeywordLabels(){
  return ['A365','Concentrix','Fortel','GEA','MDY','Partner','Atento Perú','BPO Perú','Grupo Recupera'];
}

function _autoCommentForCompetencias() {
  try {
    const nombreEl = document.getElementById('nombre');
    const docEl = document.getElementById('documento');
    const cat = document.getElementById('categoria');
    const texto = ((nombreEl && nombreEl.value) || '') + ' ' + ((docEl && docEl.value) || '');
    const encontrados = _detectKeywordsFromText(texto);

    // Guardar sólo los detectados actualmente (no hacer merge permanente)
    _storeDetectedKeywords(encontrados);

    // Si la categoría actual es Competencias, actualizar el campo comentarios
    const catVal = (cat && (cat.value || '').trim().toLowerCase()) || '';
    if (catVal === 'competencias') {
      const comentariosEl = document.getElementById('comentarios');
      if (!comentariosEl) return;
      const actual = (comentariosEl.value || '').split(';').map(s => s.trim()).filter(Boolean);

      // Separar comentarios manuales (los que no estén en la lista de etiquetas)
      const labels = _getAllKeywordLabels();
      const manual = actual.filter(c => !labels.includes(c));

      // Unir manuales + detectados actuales (evitar duplicados)
      const merged = manual.slice();
      encontrados.forEach(k => { if (!merged.includes(k)) merged.push(k); });

      comentariosEl.value = merged.join('; ');
    }
  } catch (e) { /* ignore */ }
}

// Listeners: detectar en tiempo real y aplicar cuando se active la categoría
document.addEventListener('DOMContentLoaded', () => {
  try {
    const nombre = document.getElementById('nombre');
    const doc = document.getElementById('documento');
    const cat = document.getElementById('categoria');
    const events = ['input','change','keyup','compositionend'];
    const attach = (el)=>{
      if(!el) return;
      events.forEach(ev=>el.addEventListener(ev, _autoCommentForCompetencias));
      // paste/cut: esperar al próximo ciclo para leer el valor actualizado
      el.addEventListener('paste', ()=> setTimeout(_autoCommentForCompetencias, 0));
      el.addEventListener('cut', ()=> setTimeout(_autoCommentForCompetencias, 0));
    };
    attach(nombre); attach(doc);
    if (cat) cat.addEventListener('input', () => {
      try {
        const catVal = (cat.value || '').trim().toLowerCase();
        if (catVal === 'competencias') {
          const keys = _getStoredDetectedKeywords();
          _applyKeywordsToComments(keys);
        }
      } catch (e) { /* ignore */ }
    });
  } catch (e) { /* ignore */ }
});

function borrarHistorial() {
  if (confirm("¿Estás seguro de borrar todos los formularios guardados? Esta acción no se puede deshacer.")) {
    // Solo eliminamos los registros guardados; no tocar el formulario actual ni el cronómetro
    registros = [];
    localStorage.removeItem("registros");
    try{ if(typeof window.syncRegistros === 'function') window.syncRegistros([]); }catch(e){}
    document.getElementById("contador-formularios").textContent = "🗂️ 0 Registros";
    alert("Historial eliminado con éxito. El formulario actual no fue modificado.");

    // No resetear el cronómetro ni borrar borradores para preservar la tipificación en curso

    // Emitir evento para que otras vistas (p. ej. Registros.html) puedan actualizarse si están abiertas
    try { window.dispatchEvent(new Event('registros:cleared')); } catch (e) { /* ignore */ }
  }
}

const opcionesPorCategoria = {
    "Accesos al Portal": ["Asignar rol y organización"],
    "Banner": ["Actualizar", "Desactivar", "Diseñar", "Publicar"],
    "Base Usuarios": ["Asignar rol y organización", "Desactivar, eliminar usuarios"],
    "Bases": ["Actualizar", "Desactivar", "Publicar"],
    "Boletín": ["Actualizar", "Diseñar y publicar"],
    "Competencias": ["Agregar Candidatos", "Ampliación de Proceso", "Atención Fallas", "Cambio de Correo", "Creación de Proceso", "Envío Recordatorio", "Reportes"],
    "Consolidado de Precios": ["Actualizar listas", "Implementación Nuevas Opciones", "Stock Diario (11092023)"],
    "Diagrama Postventa": ["Actualizar", "Propuesta", "Publicar"],
    "Diagrama Venta (Resumen NP)": ["Actualizar", "Creación de Diagrama", "Desactivar", "Publicar"],
    "Documento": ["Actualizar", "Dar formato SUIC", "Desactivar"],
    "Ficha": ["Actualizar Ficha", "Actualizar Registro del Caso", "Creación Ficha", "Creación Registro del Caso", "Desactivar Ficha", "Desactivar Registro del Caso", "Publicar Ficha", "Publicar Registro del Caso"],
    "Hojas de Venta": ["Desactivar", "Publicar"],
    "INFO ATC": ["Actualizar Info ATC", "Crear Info ATC", "Desactivar"],
    "Otros": ["Capacitación", "Reunión", "Revisión de fallas", "Tiempo Fallas en el Portal", "Trabajos TI en MDY"],
    "Pop up": ["Diseñar y publicar", "Programar Alerta"],
    "Proyecto": ["Propuesta de Mejora", "Proyectos C&C"],
    "Publicaciones": ["Publicar"],
  // Puedes agregar más pares categoría ↔ opciones aquí
};

// Listener protegido para actualizar el datalist 'detalles' según la categoría (si existe en el DOM)
(function(){
  const categoriaEl = document.getElementById("categoria");
  if (!categoriaEl) return;
  categoriaEl.addEventListener("change", function () {
    const valorCategoria = this.value.trim();
    const detalleLista = document.getElementById("detalles");
    if (!detalleLista) return;

    detalleLista.innerHTML = "";

    const nuevasOpciones = opcionesPorCategoria[valorCategoria];

    if (nuevasOpciones) {
      nuevasOpciones.forEach(opcionTexto => {
        const opcion = document.createElement("option");
        opcion.value = opcionTexto;
        detalleLista.appendChild(opcion);
      });
    } else {
      const opcionesGenerales = [
        "Actualizar Ficha", "Actualizar Info ATC", "Actualizar listas",
        "Actualizar Registro del Caso", "Agregar Candidatos",
        "Ampliación de Proceso", "Asignar rol y organización",
        "Atención Fallas", "Cambio de Correo", "Capacitación",
        "Creación de Diagrama", "Creación de Proceso", "Creación Ficha",
        "Creación Registro del Caso", "Crear Info ATC", "Dar formato SUIC",
        "Desactivar", "Desactivar Ficha", "Desactivar Registro del Caso",
        "Desactivar, eliminar usuarios", "Diseñar", "Diseñar y publicar",
        "Envío Recordatorio", "Implementación Nuevas Opciones",
        "Programar Alerta", "Propuesta", "Propuesta de Mejora",
        "Proyectos C&C", "Publicar", "Publicar Ficha",
        "Publicar Registro del Caso", "Reportes", "Reunión",
        "Revisión de fallas", "Stock Diario (11092023)",
        "Tiempo Fallas en el Portal", "Trabajos TI en MDY"
      ];

      opcionesGenerales.forEach(opcionTexto => {
        const opcion = document.createElement("option");
        opcion.value = opcionTexto;
        detalleLista.appendChild(opcion);
      });
    }
  });
})();

/* ============================================
   AUTO-COMPLETACIÓN AL PRESIONAR ENTER
   Para inputs con datalist: si solo queda una opción filtrada, se auto-completa al presionar Enter
   ============================================ */

function setupAutocompleteOnEnter(inputId, dataListId) {
  const inputEl = document.getElementById(inputId);
  const dataListEl = document.getElementById(dataListId);
  
  if (!inputEl || !dataListEl) return;
  
  inputEl.addEventListener('keydown', (e) => {
    // Solo procesar Enter
    if (e.key !== 'Enter') return;
    
    const currentValue = (inputEl.value || '').trim().toLowerCase();
    if (!currentValue) return; // No hacer nada si el input está vacío
    
    // Obtener todas las opciones del datalist
    const options = Array.from(dataListEl.querySelectorAll('option'));
    
    // Filtrar opciones que coincidan con el valor actual (case-insensitive)
    const matchingOptions = options.filter(opt => 
      (opt.value || '').toLowerCase().includes(currentValue)
    );
    
    // Si solo hay una opción coincidente, asignarla
    if (matchingOptions.length === 1) {
      e.preventDefault();
      inputEl.value = matchingOptions[0].value;
      // Disparar evento 'change' para que se ejecuten otros handlers si existen
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      // Cerrar la lista desplegable quitando el foco
      inputEl.blur();
    }
  });
}

// Inicializar auto-completación para las 7 secciones solicitadas
document.addEventListener('DOMContentLoaded', () => {
  // Tiempo de Gestión
  setupAutocompleteOnEnter('tiempo', 'tiempos');
  
  // Nuevo o Actualizado
  setupAutocompleteOnEnter('actualizado', 'estados');
  
  // Categoría
  setupAutocompleteOnEnter('categoria', 'categorias');
  
  // Asignado a
  setupAutocompleteOnEnter('asignado', 'asignados');
  
  // Prioridad
  setupAutocompleteOnEnter('prioridad', 'prioridades');
  
  // Detalle de Solicitud
  setupAutocompleteOnEnter('detalle', 'detalles');
  
  // Tipos de Canales
  setupAutocompleteOnEnter('tipos-canales', 'tipos-canales-list');
});

/* ============================================
   DOBLE CLIC RÁPIDO PARA LIMPIAR CAMPOS
   Al dar doble clic rápido en un input, se borra su contenido
   ============================================ */

function setupDoubleClickClear(inputId) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;
  
  let lastClickTime = 0;
  const DOUBLE_CLICK_THRESHOLD = 300; // ms
  
  inputEl.addEventListener('click', (e) => {
    const now = Date.now();
    const timeDiff = now - lastClickTime;
    
    // Si el segundo clic ocurre dentro del umbral, limpiar
    if (timeDiff < DOUBLE_CLICK_THRESHOLD) {
      e.preventDefault();
      inputEl.value = '';
      // Disparar evento 'change' para que se ejecuten otros handlers si existen
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      lastClickTime = 0; // Resetear para evitar triple clic
    } else {
      lastClickTime = now;
    }
  });
}

// Inicializar doble clic para limpiar en los campos solicitados
document.addEventListener('DOMContentLoaded', () => {
  // Campos normales (SUIC Data.html)
  setupDoubleClickClear('nombre');
  setupDoubleClickClear('acciones');
  setupDoubleClickClear('detalle');
  setupDoubleClickClear('fallas');
  setupDoubleClickClear('tiempo');
  setupDoubleClickClear('actualizado');
  setupDoubleClickClear('documentos');
  setupDoubleClickClear('categoria');
  setupDoubleClickClear('analista');
  setupDoubleClickClear('documento');
  setupDoubleClickClear('asignado');
  setupDoubleClickClear('prioridad');
  setupDoubleClickClear('cant-escuelas');
  setupDoubleClickClear('cant-candidatos');
  setupDoubleClickClear('tipos-canales');
});






