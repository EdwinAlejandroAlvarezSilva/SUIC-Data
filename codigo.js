// Cronómetro (contador incremental) en formato HH:MM:SS
// Comportamiento:
// - Inicia o continúa cuando se selecciona 'En proceso' (inicio) o 'Continuar' (final)
// - Se pausa cuando se selecciona 'En pausa', 'Reasignado' o 'Finalizado'
let _chronInterval = null;
let _elapsedSeconds = 0; // segundos acumulados en pausas previas
let _running = false;
let _lastStartTs = null; // timestamp ms cuando se inició la última vez

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

function _startChrono() {
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

setInterval(() => {
  localStorage.setItem("registros", JSON.stringify(registros));
}, 300000); // Guarda cada 5 minutos

function guardarFormulario() {
  const campos = [
    "hora-inicio", "inicio", "hora-final", "final", "nombre", "acciones", "detalle",
    "fallas", "descripcion", "comentarios", "tiempo", "actualizado", "documentos",
    "categoria", "analista", "documento", "asignado", "prioridad"
  ];
  const opcionales = ["fallas", "descripcion", "comentarios"];

  // Validar que todos los campos requeridos estén llenos
  let faltantes = [];
  campos.forEach(id => {
    if (opcionales.includes(id)) return; // omitir validación si es opcional
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

  if (faltantes.length > 0) {
    alert("Debes rellenar todos los datos obligatorios antes de guardar.");
    return;
  }

  // Si todo está bien, guardar
  const registro = campos.map(id => {
    const el = document.getElementById(id);
    if (!el) return "";
    if (el.tagName === "SELECT") {
      return el.options[el.selectedIndex]?.text || "";
    }
    return el.value || "";
  });

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
  } catch (e) {
    // Si algo falla, no impedir el guardado
    registro.push(''); registro.push('');
  }

  registros.push(registro);
  localStorage.setItem("registros", JSON.stringify(registros));
  // Borrar borrador tras guardado exitoso
  try { _clearDraft(); } catch (e) { /* ignore */ }

  document.getElementById("contador-formularios").textContent =
    `🗂️ ${registros.length} Registro${registros.length === 1 ? "" : "s"}`;

  // Resetear formulario y cronómetro al guardar para evitar inconsistencias
  borrarDatos();
  _resetChrono();
  // Autocompletar valores por defecto después de guardar
  document.getElementById("tiempo").value = "En Línea (1 - 10 minutos)";
  document.getElementById("actualizado").value = "Nuevo";
  document.getElementById("prioridad").value = "Medium";
  var hoy = new Date();
  var yyyy = hoy.getFullYear();
  var mm = String(hoy.getMonth() + 1).padStart(2, '0');
  var dd = String(hoy.getDate()).padStart(2, '0');
  // Campo Fecha de Entrega eliminado: ya no se asigna aquí.
  alert("Formulario guardado. Puedes llenar otro.");
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
    "Nombre de Documento", "Asignado a", "Prioridad", "Tiempo (cronómetro)"
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
    const needed = encabezados.length; // 19
    if (fila.length < needed) {
      while(fila.length < needed - 1) fila.push('');
      fila.push(calcularCronoDesdeFila(fila));
    } else if (fila.length === needed) {
      const last = fila[fila.length - 1];
      if(!(typeof last === 'string' && /^\d{1,2}:\d{2}:\d{2}$/.test(String(last).trim()))) {
        fila[fila.length - 1] = calcularCronoDesdeFila(fila);
      }
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
      _startChrono();
    } else {
      // cualquier otra selección en inicio no detiene por sí sola el cronómetro
    }
  }

  // Final: controlar cronómetro según selección
  if (tipo === 'final') {
    if (['Continuar', 'En proceso'].includes(valor)) {
      // Continuar/seguir: iniciar o continuar cronómetro
      _startChrono();
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
  const campos = [
    { id: "hora-inicio" }, { id: "inicio" }, { id: "hora-final" }, { id: "final" },
    { id: "nombre" }, { id: "acciones" }, { id: "detalle" }, { id: "fallas" },
    { id: "descripcion" }, { id: "comentarios" }, { id: "tiempo" }, { id: "actualizado" },
    { id: "documentos" }, { id: "categoria" }, { id: "analista" }, { id: "documento" },
      { id: "asignado" }, { id: "prioridad" }
  ];

  const encabezados = campos.map(c => `"${document.querySelector(`label[for="${c.id}"]`)?.innerText || c.id}"`).join(",");
  const valores = campos.map(c => {
    const el = document.getElementById(c.id);
    if (!el) return '""';
    if (el.tagName === "SELECT") {
      return `"${el.options[el.selectedIndex]?.text || ""}"`;
    }
    return `"${el.value || ""}"`;
  }).join(",");

  const contenidoCSV = `${encabezados}\n${valores}`;
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
    if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else if (['text', 'number', 'date'].includes(el.type) || el.tagName === 'TEXTAREA') {
      el.value = '';
    }
  });
  // Asegurar que el cronómetro se muestra en 00:00:00 al limpiar campos
  try { _resetChrono(); } catch (e) { /* ignore */ }
}

window.addEventListener("load", () => {
  const dataGuardada = localStorage.getItem("registros");
  if (dataGuardada) {
    registros = JSON.parse(dataGuardada);
    document.getElementById("contador-formularios").textContent =
      `🗂️ ${registros.length} Registro${registros.length === 1 ? "" : "s"}`;
  }
  // Intentar restaurar borrador (si existe)
  try { _restoreDraftPrompt(); } catch (e) { /* ignore */ }
});

function borrarHistorial() {
  if (confirm("¿Estás seguro de borrar todos los formularios guardados? Esta acción no se puede deshacer.")) {
    registros = [];
    localStorage.removeItem("registros");
    document.getElementById("contador-formularios").textContent = "🗂️ 0 Registros";
    alert("Historial eliminado con éxito.");
    // Resetear cronómetro cuando se borra todo el historial
    try { _resetChrono(); } catch (e) { /* ignore */ }
    // Borrar borrador también
    try { _clearDraft(); } catch (e) { /* ignore */ }
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
    "INFO ATC": ["Crear Info ATC", "Desactivar", "Publicar"],
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
        "Actualizar", "Agregar Candidatos", "Capacitación", "Creación de Proceso",
        "Desactivar", "Publicar Registro del Caso", "Reunión", "Tiempo Fallas en el Portal"
      ];

      opcionesGenerales.forEach(opcionTexto => {
        const opcion = document.createElement("option");
        opcion.value = opcionTexto;
        detalleLista.appendChild(opcion);
      });
    }
  });
})();






