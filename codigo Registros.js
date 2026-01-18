// Script para renderizar la tabla de registros en Registros.html

function formatCell(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

// Mapeo de opciones por categoría (replicado desde codigo.js para comportamiento consistente)
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
};

function actualizarDetalleDatalist(valorCategoria, datalistId = 'detalles') {
  try {
    const detalleLista = document.getElementById(datalistId);
    if (!detalleLista) return;
  detalleLista.innerHTML = '';
  const nuevasOpciones = opcionesPorCategoria[valorCategoria];
    if (nuevasOpciones) {
      nuevasOpciones.forEach(opcionTexto => {
        const opcion = document.createElement('option');
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
        const opcion = document.createElement('option');
        opcion.value = opcionTexto;
        detalleLista.appendChild(opcion);
      });
    }
  } catch (e) { console.error('Error actualizando datalist detalles:', e); }

}

// Mapeo detalle -> tiempo (valores mostrados en el input #tiempo / #edit-tiempo)
const detalleToTiempo = {
  'En Línea (1 - 10 minutos)': 'En Línea (1 - 10 minutos)',
  'Actualizar': 'En Línea (1 - 10 minutos)',
  'Actualizar Ficha': 'Medio (91 - 180 minutos)',
  'Creación de Proceso': 'Alto (181 - 360 minutos)',
  'Creación Ficha': 'Medio (91 - 180 minutos)',
  'Agregar Candidatos': 'Medio (91 - 180 minutos)',
  'Capacitación': 'Alto (181 - 360 minutos)',
  'Desactivar': 'Medio (91 - 180 minutos)',
  'Publicar': 'Medio (91 - 180 minutos)',
  'Reportes': 'Superior (más de 361 minutos)',
  'Propuesta': 'Medio (91 - 180 minutos)',
  'Programar Alerta': 'En Línea (1 - 10 minutos)'
};

function getTiempoForDetalle(detalle) {
  if (!detalle) return '';
  if (detalleToTiempo.hasOwnProperty(detalle)) return detalleToTiempo[detalle];
  // si no existe, añadir con valor por defecto y devolverlo
  const defecto = 'Medio (91 - 180 minutos)';
  detalleToTiempo[detalle] = defecto;
  return defecto;
}

// Función para formatear fechas al formato hh:mm:ss dd/mm/yyyy
function formatDateTime(value) {
  if (!value) return '';
  let date;
  if (typeof value === 'number') {
    // Excel serial date (días desde 1900-01-01)
    date = new Date((value - 25569) * 86400 * 1000);
  } else if (typeof value === 'string') {
    // Intentar parsear como fecha
    date = new Date(value);
  } else {
    return value; // Si no es número ni string, devolver como está
  }
  if (isNaN(date.getTime())) return value; // Si no es fecha válida, devolver original
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${min}:${ss} ${dd}/${mm}/${yyyy}`;
}

// Variables para la columna de selección
let showSelectionColumn = false;
let selectedRows = new Set();
function crearTabla(registros, storedIndices) {
  const container = document.getElementById('registros-container');
  container.innerHTML = '';

  if (!registros || registros.length === 0) {
    container.innerHTML = '<div style="padding:1rem; background:#fff8e1; border:1px solid #ffe0b2; border-radius:8px;">No hay registros guardados.</div>';
    document.getElementById('registros-count').textContent = '0 registros';
    return;
  }

  // Encabezados (coinciden con el orden que guarda codigo.js)
  const encabezados = [
    "Inicio", "Estado Inicio", "Final", "Estado Final", "Nombre", "Acciones",
    "Detalle", "Fallas", "Descripción", "Comentarios", "Tiempo de Gestión",
    "Nuevo/Actualizado", "Cant Documentos", "Categoría", "Analista/Área",
    "Nombre Documento", "Asignado a", "Prioridad",
    "Actualizado", "Tiempo"
  ];

  const table = document.createElement('table');
  table.className = 'registros-table';

  // Column visibility (leer desde localStorage)
  const defaultVisible = encabezados.map(() => true).concat([true]); // incluir columna Acciones
  let visible = defaultVisible;
  try {
    const saved = localStorage.getItem('registros_columns_visible');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === encabezados.length + 1) visible = parsed;
    }
  } catch (e) { /* ignore */ }

  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  if (showSelectionColumn) {
    const thSel = document.createElement('th');
    thSel.textContent = 'Seleccionar';
    thSel.style.textAlign = 'center';
    trh.appendChild(thSel);
  }
  encabezados.forEach((h, colIdx) => {
    const th = document.createElement('th');
    th.textContent = h;
    if (!visible[colIdx]) th.style.display = 'none';
    trh.appendChild(th);
  });
  // Añadir columna acciones
  const thAcc = document.createElement('th');
  thAcc.textContent = 'Acciones';
  if (!visible[encabezados.length]) thAcc.style.display = 'none';
  trh.appendChild(thAcc);
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  registros.forEach((fila, idx) => {
    const tr = document.createElement('tr');
    // índice real en el array guardado
    const realIndex = Array.isArray(storedIndices) ? storedIndices[idx] : idx;

    if (showSelectionColumn) {
      const tdSel = document.createElement('td');
      tdSel.style.textAlign = 'center';
      tdSel.style.verticalAlign = 'middle';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = selectedRows.has(realIndex);
      chk.addEventListener('change', () => {
        if (chk.checked) {
          selectedRows.add(realIndex);
        } else {
          selectedRows.delete(realIndex);
        }
      });
      tdSel.appendChild(chk);
      tr.appendChild(tdSel);
    }

    // Crear celdas en base a los encabezados esperados
    const tiempoColIdxInner = encabezados.indexOf('Tiempo');
    for (let colIdx = 0; colIdx < encabezados.length; colIdx++) {
      const td = document.createElement('td');
      td.setAttribute('data-label', encabezados[colIdx] || '');
      if (colIdx === tiempoColIdxInner) {
        try {
          const lastIdx = fila.length - 1;
          const possibleCrono = fila[lastIdx];
          const isHMS = typeof possibleCrono === 'string' && /^\d{1,2}:\d{2}:\d{2}$/.test(String(possibleCrono).trim());
          if (isHMS) {
            td.textContent = String(possibleCrono).trim();
          } else {
            // Fallback: calcular diferencia entre inicio y final
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
            if (a && b) {
              const diff = Math.abs(b - a);
              const totalSeconds = Math.floor(diff / 1000);
              const hours = Math.floor(totalSeconds / 3600);
              const mins = Math.floor((totalSeconds % 3600) / 60);
              const secs = totalSeconds % 60;
              const pad = (n) => String(n).padStart(2, '0');
              td.textContent = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
            } else {
              td.textContent = '';
            }
          }
        } catch (e) { td.textContent = ''; }
      } else {
        const val = fila[colIdx];
        td.textContent = formatCell(val);
      }
      if (!visible[colIdx]) td.style.display = 'none';
      tr.appendChild(td);
    }

    // Columna de acciones (eliminar + editar)
    const tdAcc = document.createElement('td');
    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn btn-sm btn-danger';
    btnEliminar.title = 'Eliminar registro';
    btnEliminar.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/></svg>
      <span>Eliminar</span>
    `;
    btnEliminar.addEventListener('click', () => {
      if (!confirm('¿Eliminar este registro?')) return;
      try {
        const raw = localStorage.getItem('registros');
        const all = raw ? JSON.parse(raw) : [];
        if (Array.isArray(all) && typeof realIndex === 'number') {
          all.splice(realIndex, 1);
          localStorage.setItem('registros', JSON.stringify(all));
        }
      } catch (e) { console.error(e); }
      cargarYMostrar();
    });
    tdAcc.appendChild(btnEliminar);

    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn btn-sm btn-neutral';
    btnEditar.style.marginLeft = '0.4rem';
    btnEditar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span>Editar</span>`;
    btnEditar.title = 'Editar registro';
    btnEditar.addEventListener('click', () => openEditModal(realIndex));
    tdAcc.appendChild(btnEditar);
    if (!visible[encabezados.length]) tdAcc.style.display = 'none';
    tr.appendChild(tdAcc);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
  document.getElementById('registros-count').textContent = `${registros.length} registro(s)`;
}

/* --- Modal edit helpers --- */
function openEditModal(index) {
  let datos = [];
  try { const raw = localStorage.getItem('registros'); if (raw) datos = JSON.parse(raw); } catch(e) { console.error(e); }
  const fila = datos[index];
  if (!fila) return alert('Registro no encontrado');

  // Mapear campos del modal con el array (misma posición que en guardar)
  const ids = [
    'edit-hora-inicio','edit-inicio','edit-hora-final','edit-final','edit-nombre','edit-acciones',
    'edit-detalle','edit-fallas','edit-descripcion','edit-comentarios','edit-tiempo','edit-actualizado',
    'edit-documentos','edit-categoria','edit-analista','edit-documento','edit-asignado','edit-prioridad'
  ];

  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = fila[i] || '';
  });

  // Si el registro tiene un campo extra al final (cronómetro en HH:MM:SS), cargarlo en edit-cronometro
  try {
    const cronEl = document.getElementById('edit-cronometro');
    if (cronEl) {
      const last = fila.length - 1;
      const possible = fila[last];
      cronEl.value = (typeof possible === 'string' && /^\d{1,2}:\d{2}:\d{2}$/.test(String(possible).trim())) ? String(possible).trim() : '';
    }
  } catch (e) { /* ignore */ }

  // Al llenar el modal, también actualizar el datalist 'detalles' según la categoría actual
  const catVal = document.getElementById('edit-categoria')?.value || '';
  if (catVal) actualizarDetalleDatalist(catVal, 'detalles');

  // Fijar el tiempo del modal según el detalle si existe
  const detalleModal = document.getElementById('edit-detalle')?.value || '';
  const tiempoModalEl = document.getElementById('edit-tiempo');
  // Sólo rellenar el campo edit-tiempo desde el mapeo si no tiene ya un valor guardado
  if (tiempoModalEl && !tiempoModalEl.value) tiempoModalEl.value = getTiempoForDetalle(detalleModal);
  
  // Inicializar estado del cronómetro modal según valores guardados, SIN modificar inputs al abrir.
  // Priorizar el campo oculto 'edit-cronometro' si existe; si no, usar el valor de 'edit-tiempo' sólo si tiene formato HH:MM:SS.
  _resetModalChrono();
  try {
    const cronHidden = (document.getElementById('edit-cronometro')?.value || '').trim();
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(cronHidden)) {
      const parts = cronHidden.split(':').map(Number);
      _modalElapsedSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else {
      const tiempoStr = (document.getElementById('edit-tiempo')?.value || '').trim();
      const hhmmss = tiempoStr.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
      if (hhmmss) {
        const hrs = Number(hhmmss[1]);
        const mins = Number(hhmmss[2]);
        const secs = Number(hhmmss[3]);
        _modalElapsedSeconds = hrs * 3600 + mins * 60 + secs;
      } else {
        // Como último recurso, intentar calcularlo a partir de edit-hora-inicio y edit-hora-final
        const hi = document.getElementById('edit-hora-inicio')?.value || '';
        const hf = document.getElementById('edit-hora-final')?.value || '';
        const parse = (s) => {
          if (!s || typeof s !== 'string') return null;
          const parts = s.split(' ');
          if (parts.length < 2) return null;
          const time = parts[0].split(':').map(Number);
          const date = parts[1].split('/').map(Number);
          if (time.length < 3 || date.length < 3) return null;
          return new Date(date[2], date[1]-1, date[0], time[0], time[1], time[2]);
        };
        const d1 = parse(hi);
        const d2 = parse(hf);
        if (d1 && d2) {
          const totalSeconds = Math.floor(Math.abs(d2 - d1) / 1000);
          _modalElapsedSeconds = totalSeconds;
        } else {
          _modalElapsedSeconds = 0;
        }
      }
    }
    _updateModalChronDisplay();
  } catch (e) { console.error('Error inicializando cronómetro modal:', e); }

  // Guardar índice en el modal (dataset)
  const modal = document.getElementById('edit-modal');
  if (!modal) return;
  modal.dataset.editIndex = String(index);
  // No mostrar diferencia inicio/final: el modal usa sólo el cronómetro.
  // Mostrar modal
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');

  // Intentar restaurar borrador específico del modal si existe (comportamiento similar a SUIC Data)
  try {
    _restoreModalDraftPrompt();
  } catch (e) { /* ignore */ }

  // Iniciar autosave sólo para el modal mientras esté abierto
  try {
    _startModalAutosave();
  } catch (e) { /* ignore */ }
  // Forzar ancho de 170px en inputs/selects de Inicio/Final para garantizar el tamaño
  try {
    const idsToForce = ['edit-hora-inicio','edit-inicio','edit-hora-final','edit-final'];
    idsToForce.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.setProperty('width', '170px', 'important');
      el.style.setProperty('min-width', '170px', 'important');
      el.style.setProperty('max-width', '170px', 'important');
    });
  } catch (e) { /* ignore */ }
}

function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  // Detener autosave y limpiar borrador del modal al cerrarlo
  try { _stopModalAutosave(); } catch (e) {}
  try { _clearModalDraft(); } catch (e) {}
}

function saveEdit() {
  const modal = document.getElementById('edit-modal');
  if (!modal) return;
  const index = Number(modal.dataset.editIndex);
  if (isNaN(index)) return alert('Índice inválido');

  const ids = [
    'edit-hora-inicio','edit-inicio','edit-hora-final','edit-final','edit-nombre','edit-acciones',
    'edit-detalle','edit-fallas','edit-descripcion','edit-comentarios','edit-tiempo','edit-actualizado',
    'edit-documentos','edit-categoria','edit-analista','edit-documento','edit-asignado','edit-prioridad'
  ];

  let datos = [];
  try { const raw = localStorage.getItem('registros'); if (raw) datos = JSON.parse(raw); } catch(e) { console.error(e); }
  if (!Array.isArray(datos) || !datos[index]) return alert('Registro no encontrado');

  const nuevo = ids.map(id => {
    const el = document.getElementById(id);
    if (!el) return '';
    // Convertir campos numéricos a número
    if (id === 'edit-acciones' || id === 'edit-documentos') {
      const v = el.value;
      return v === '' ? '' : Number(v);
    }
    return el.value || '';
  });
  // Añadir al final el campo 'Actualizado' (timestamp) y luego el cronómetro (campo oculto edit-cronometro)
  try {
    // timestamp de actualización: HH:MM:SS DD/MM/YYYY
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mm = String(ahora.getMinutes()).padStart(2, '0');
    const ss = String(ahora.getSeconds()).padStart(2, '0');
    const dd = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const yyyy = ahora.getFullYear();
    const ts = `${hh}:${mm}:${ss} ${dd}/${mes}/${yyyy}`;
    nuevo.push(ts);
  } catch (e) { nuevo.push(''); }
  // Añadir al final el cronómetro (campo oculto edit-cronometro)
  try {
    const cron = document.getElementById('edit-cronometro');
    nuevo.push(cron ? (cron.value || '') : '');
  } catch (e) { nuevo.push(''); }

  // Reemplazar el registro editado y moverlo al inicio para que aparezca primero
  try {
    // Eliminar el registro original en su posición
    if (typeof index === 'number' && index >= 0 && index < datos.length) {
      datos.splice(index, 1);
    }
  } catch (e) { /* ignore */ }
  // Insertar al inicio
  datos.unshift(nuevo);
  localStorage.setItem('registros', JSON.stringify(datos));
  closeEditModal();
  cargarYMostrar();
  // Al guardar el registro, eliminar el borrador del modal y detener autosave
  try { _stopModalAutosave(); } catch (e) {}
  try { _clearModalDraft(); } catch (e) {}
}

// Asociar botones del modal
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'edit-modal-close') closeEditModal();
  if (e.target && e.target.id === 'edit-cancel') closeEditModal();
  if (e.target && e.target.id === 'edit-save') saveEdit();
});

// --- Autosave / Restore específico para el modal de edición (Registros) ---
const MODAL_DRAFT_KEY = 'suic_registros_edit_draft';
let _modalAutoSaveInterval = null;
let _modalAutosaveActive = false;

function _serializeModalFields() {
  const ids = [
    'edit-hora-inicio','edit-inicio','edit-hora-final','edit-final','edit-nombre','edit-acciones',
    'edit-detalle','edit-fallas','edit-descripcion','edit-comentarios','edit-tiempo','edit-actualizado',
    'edit-documentos','edit-categoria','edit-analista','edit-documento','edit-asignado','edit-prioridad','edit-cronometro'
  ];
  const data = {};
  ids.forEach(id => {
    try {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT') data[id] = { type: 'select', selectedIndex: el.selectedIndex };
      else data[id] = { type: 'input', value: el.value };
    } catch (e) { /* ignore */ }
  });
  return data;
}

function _applySerializedModalFields(data) {
  if (!data || typeof data !== 'object') return;
  Object.keys(data).forEach(id => {
    try {
      const el = document.getElementById(id);
      if (!el) return;
      const info = data[id];
      if (!info) return;
      if (info.type === 'select' && typeof info.selectedIndex === 'number') el.selectedIndex = info.selectedIndex;
      else if (info.type === 'input') el.value = info.value || '';
    } catch (e) { /* ignore */ }
  });
}

function _saveModalDraft() {
  try {
    const modal = document.getElementById('edit-modal');
    if (!modal || modal.style.display === 'none') return;
    // Guardar el tiempo total tal como se muestra en el modal en el momento del autosave.
    let totalSeconds = _modalElapsedSeconds || 0;
    if (_modalRunning && _modalLastStartTs) {
      totalSeconds += Math.floor((Date.now() - _modalLastStartTs) / 1000);
    }
    const draft = {
      timestamp: Date.now(),
      fields: _serializeModalFields(),
      chrono: {
        elapsedSeconds: totalSeconds,
        running: _modalRunning,
        lastStartTs: _modalLastStartTs
      }
    };
    localStorage.setItem(MODAL_DRAFT_KEY, JSON.stringify(draft));
  } catch (e) { /* ignore */ }
}

function _clearModalDraft() {
  try { localStorage.removeItem(MODAL_DRAFT_KEY); } catch (e) { /* ignore */ }
}

function _restoreModalDraftPrompt() {
  try {
    const raw = localStorage.getItem(MODAL_DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (!draft) return;
    // Si el autoborrador está activado, eliminar sin preguntar
    try { if (localStorage.getItem('autodelete_enabled') === '1') { localStorage.removeItem(MODAL_DRAFT_KEY); return; } } catch(e){}
    const ok = confirm('Se encontró un borrador de edición. ¿Deseas restaurarlo en el modal?');
    if (!ok) return;
    // Aplicar campos
    _applySerializedModalFields(draft.fields);
    // Restaurar cronómetro modal: calcular acumulado si venía corriendo y dejarlo detenido
    try {
      if (draft.chrono) {
        const storedElapsed = Number(draft.chrono.elapsedSeconds) || 0;
        const wasRunning = !!draft.chrono.running;
        const storedLast = draft.chrono.lastStartTs ? Number(draft.chrono.lastStartTs) : null;
        // Restaurar sólo el tiempo exacto guardado (sin sumar el tiempo transcurrido
        // entre el momento del guardado y la apertura de la página). En todos los
        // casos dejamos el cronómetro en pausa para que el usuario decida si
        // desea reanudarlo manualmente.
        _modalElapsedSeconds = storedElapsed;
        _modalRunning = false;
        _modalLastStartTs = null;
        _updateModalChronDisplay();
        // Asegurar que el hidden field edit-cronometro refleje el valor
        const cronEl = document.getElementById('edit-cronometro');
        if (cronEl) cronEl.value = _modalFormatHHMMSS(_modalElapsedSeconds);
      }
    } catch (e) { _updateModalChronDisplay(); }
  } catch (e) { /* ignore parse errors */ }
}

function _startModalAutosave() {
  if (_modalAutosaveActive) return;
  _modalAutosaveActive = true;
  try { _saveModalDraft(); } catch (e) {}
  _modalAutoSaveInterval = setInterval(_saveModalDraft, 5000);
  // Guardar al ocultarse o cerrar la pestaña
  document.addEventListener('visibilitychange', _saveModalDraft);
  window.addEventListener('beforeunload', _saveModalDraft);
}

function _stopModalAutosave() {
  if (!_modalAutosaveActive) return;
  _modalAutosaveActive = false;
  try { if (_modalAutoSaveInterval) clearInterval(_modalAutoSaveInterval); } catch (e) {}
  _modalAutoSaveInterval = null;
  try { document.removeEventListener('visibilitychange', _saveModalDraft); } catch (e) {}
  try { window.removeEventListener('beforeunload', _saveModalDraft); } catch (e) {}
}

// Helper: debounce
function debounce(fn, wait) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Llenar el selector de columnas para el buscador
function poblarSelectorColumnas() {
  const selector = document.getElementById('buscador-columna');
  if (!selector) return;
  selector.innerHTML = '';
  const opciones = [
    "Inicio", "Estado Inicio", "Final", "Estado Final", "Nombre", "Acciones",
    "Detalle", "Fallas", "Descripción", "Comentarios", "Tiempo de Gestión",
    "Nuevo/Actualizado", "Cant Documentos", "Categoría", "Analista/Área",
    "Nombre Documento", "Asignado a", "Prioridad", "Actualizado",
    "Tiempo"
  ];
  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'Todas las columnas';
  selector.appendChild(optAll);
  opciones.forEach((o, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = o;
    selector.appendChild(opt);
  });
}

// Filtrar registros según texto y columna seleccionada
function filtrarRegistros(registros, texto, columna) {
  if (!texto) return registros;
  const t = texto.trim().toLowerCase();
  if (!t) return registros;
  return registros.filter(fila => {
    if (columna === 'all') {
      return fila.some(c => String(c || '').toLowerCase().includes(t));
    }
    const idx = Number(columna);
    if (isNaN(idx)) return false;
    return String(fila[idx] || '').toLowerCase().includes(t);
  });
}

// Filtrar y devolver pares [fila, indiceOriginal]
function filtrarRegistrosWithIndices(registros, texto, columna, fecha, columnasFecha) {
  const resultados = [];
  if (!registros || registros.length === 0) return { rows: [], indices: [] };
  if (!texto && !fecha) {
    // devolver todos
    return { rows: registros.slice(), indices: registros.map((_, i) => i) };
  }
  const t = texto ? texto.trim().toLowerCase() : '';
  const f = fecha ? fecha.trim() : '';
  registros.forEach((fila, idx) => {
    let matchTexto = !texto || (t && (
      columna === 'all' ?
        fila.some(c => String(c || '').toLowerCase().includes(t)) :
        String(fila[Number(columna)] || '').toLowerCase().includes(t)
    ));
    let matchFecha = !fecha || !columnasFecha.length || columnasFecha.some(col => {
      const val = fila[col];
      if (!val) return false;
      // Extraer fecha de formato HH:MM:SS DD/MM/YYYY
      const parts = String(val).split(' ');
      if (parts.length < 2) return false;
      const datePart = parts[1];
      // Convertir f de YYYY-MM-DD a DD/MM/YYYY
      let fFormatted = f;
      if (f.includes('-')) {
        const [yyyy, mm, dd] = f.split('-');
        fFormatted = `${dd}/${mm}/${yyyy}`;
      }
      return datePart === fFormatted;
    });
    if (matchTexto && matchFecha) {
      resultados.push({ fila, idx });
    }
  });

  return { rows: resultados.map(r => r.fila), indices: resultados.map(r => r.idx) };
}

// Generar controles de filtros de columnas
function generarControlesColumnas() {
  const cont = document.getElementById('column-filters');
  const dropdown = document.getElementById('column-filters-list');
  if (!cont || !dropdown) return;

  const encabezados = [
    "Inicio", "Estado Inicio", "Final", "Estado Final", "Nombre", "Acciones",
    "Detalle", "Fallas", "Descripción", "Comentarios", "Tiempo de Gestión",
    "Nuevo/Actualizado", "Cant Documentos", "Categoría", "Analista/Área",
    "Nombre Documento", "Asignado a", "Prioridad", "Actualizado",
    "Tiempo"
  ];

  // Leer estado guardado o por defecto true
  let visible = encabezados.map(() => true).concat([true]);
  try {
    const saved = localStorage.getItem('registros_columns_visible');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === encabezados.length + 1) visible = parsed;
    }
  } catch (e) { /* ignore */ }

  dropdown.innerHTML = '';

  const chkAll = document.createElement('input');
  chkAll.type = 'checkbox';
  chkAll.id = 'chk_all_columns';
  chkAll.checked = visible.every(v => v === true);
  const lblAll = document.createElement('label');
  lblAll.htmlFor = 'chk_all_columns';
  lblAll.style.marginRight = '0.4rem';
  lblAll.textContent = 'Todas';
  chkAll.addEventListener('change', () => {
    const checkboxes = dropdown.querySelectorAll('input[type=checkbox].col-chk');
    checkboxes.forEach(cb => { cb.checked = chkAll.checked; });
    // Guardar y re-render
    const estados = Array.from(checkboxes).map(cb => cb.checked);
    // asegurarse de incluir la columna Acciones si existe al final
    localStorage.setItem('registros_columns_visible', JSON.stringify(estados.concat([true])));
    cargarYMostrar();
  });

  dropdown.appendChild(lblAll);
  dropdown.appendChild(chkAll);

  encabezados.forEach((h, idx) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '0.4rem';
    wrapper.style.padding = '0.15rem 0.25rem';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'col-chk';
    chk.id = `col_chk_${idx}`;
    chk.checked = Boolean(visible[idx]);

    const lbl = document.createElement('label');
    lbl.htmlFor = chk.id;
    lbl.textContent = h;

    chk.addEventListener('change', () => {
      const checkboxes = dropdown.querySelectorAll('input[type=checkbox].col-chk');
      const estados = Array.from(checkboxes).map(cb => cb.checked);
      // actualizar estado del 'Todas'
      chkAll.checked = estados.every(v => v === true);
      // Guardar (añadir true para la columna acciones al final si corresponde)
      localStorage.setItem('registros_columns_visible', JSON.stringify(estados.concat([true])));
      cargarYMostrar();
    });

    wrapper.appendChild(chk);
    wrapper.appendChild(lbl);
    dropdown.appendChild(wrapper);
  });

  // Toggle del dropdown
  const btn = document.getElementById('btn-column-filters');
  if (btn) {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      dropdown.style.display = expanded ? 'none' : 'block';
      dropdown.setAttribute('aria-hidden', String(expanded));
    });

    // Cerrar cuando se haga clic fuera
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.style.display = 'none';
        btn.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('aria-hidden', 'true');
      }
    });
  }
}

function cargarYMostrar() {
  let datos = [];
  try {
    const raw = localStorage.getItem('registros');
    if (raw) datos = JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo registros:', e);
  }
  const texto = document.getElementById('buscador-texto')?.value || '';
  const columna = document.getElementById('buscador-columna')?.value || 'all';
  const fecha = document.getElementById('buscador-fecha')?.value || '';
  const columnasFecha = [];
  if (document.getElementById('chk-fecha-inicio')?.checked) columnasFecha.push(0); // Inicio
  if (document.getElementById('chk-fecha-final')?.checked) columnasFecha.push(2); // Final
  if (document.getElementById('chk-fecha-actualizado')?.checked) columnasFecha.push(18); // Actualizado
  const { rows, indices } = filtrarRegistrosWithIndices(datos, texto, columna, fecha, columnasFecha);
  crearTabla(rows, indices);
}

// Colocar hora actual en el modal según tipo ('inicio' | 'final')
function colocarHoraModal(tipo) {
  const ahora = new Date();
  const dd = String(ahora.getDate()).padStart(2, '0');
  const mm = String(ahora.getMonth() + 1).padStart(2, '0');
  const yyyy = ahora.getFullYear();
  const hh = String(ahora.getHours()).padStart(2, '0');
  const min = String(ahora.getMinutes()).padStart(2, '0');
  const ss = String(ahora.getSeconds()).padStart(2, '0');
  const valor = `${hh}:${min}:${ss} ${dd}/${mm}/${yyyy}`;
  if (tipo === 'inicio') {
    const el = document.getElementById('edit-hora-inicio');
    if (el) el.value = valor;
  } else if (tipo === 'final') {
    const el = document.getElementById('edit-hora-final');
    if (el) el.value = valor;
  }
    // No recalculamos la diferencia aquí: el modal usa el cronómetro para mostrar el tiempo
}

// --- Cronómetro específico para el modal (mismo comportamiento que en codigo.js) ---
let _modalChronInterval = null;
let _modalElapsedSeconds = 0;
let _modalRunning = false;
let _modalLastStartTs = null;

function _modalFormatHHMMSS(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function _updateModalChronDisplay() {
  const span = document.getElementById('edit-diferencia-horas');
  if (!span) return;
  let total = _modalElapsedSeconds;
  if (_modalRunning && _modalLastStartTs) {
    total += Math.floor((Date.now() - _modalLastStartTs) / 1000);
  }
  span.textContent = `Tiempo: ${_modalFormatHHMMSS(total)}`;
}

function _startModalChrono() {
  if (_modalRunning) return;
  _modalRunning = true;
  _modalLastStartTs = Date.now();
  if (!_modalChronInterval) {
    _modalChronInterval = setInterval(_updateModalChronDisplay, 1000);
  }
  _updateModalChronDisplay();
}

function _pauseModalChrono() {
  if (!_modalRunning) return;
  _modalElapsedSeconds += Math.floor((Date.now() - _modalLastStartTs) / 1000);
  _modalRunning = false;
  _modalLastStartTs = null;
  _updateModalChronDisplay();
  try {
    const cronEl = document.getElementById('edit-cronometro');
    if (cronEl) cronEl.value = _modalFormatHHMMSS(_modalElapsedSeconds);
    // respaldo en localStorage
    try { localStorage.setItem('last_modal_cronometro', _modalFormatHHMMSS(_modalElapsedSeconds)); } catch (e) { }
  } catch (e) { }
}

function _resetModalChrono() {
  if (_modalChronInterval) {
    clearInterval(_modalChronInterval);
    _modalChronInterval = null;
  }
  _modalElapsedSeconds = 0;
  _modalRunning = false;
  _modalLastStartTs = null;
  _updateModalChronDisplay();
}

// Integrar control del cronómetro del modal en colocarHoraModal: iniciar/continuar/pausar según selección
function colocarHoraModal_tipoControl(tipo, valorSelect) {
  // tipo: 'inicio' o 'final', valorSelect: opción seleccionada en el select correspondiente
  if (tipo === 'inicio') {
    // Si se selecciona 'En proceso' manualmente, establecer la hora inicio si no existe e iniciar el cronómetro
    if (valorSelect === 'En proceso') {
      const hi = document.getElementById('edit-hora-inicio');
      if (hi && !hi.value) {
        const ahora = new Date();
        const dd = String(ahora.getDate()).padStart(2, '0');
        const mm = String(ahora.getMonth() + 1).padStart(2, '0');
        const yyyy = ahora.getFullYear();
        const hh = String(ahora.getHours()).padStart(2, '0');
        const min = String(ahora.getMinutes()).padStart(2, '0');
        const ss = String(ahora.getSeconds()).padStart(2, '0');
        hi.value = `${hh}:${min}:${ss} ${dd}/${mm}/${yyyy}`;
      }
      // Iniciar el cronómetro desde el tiempo acumulado
      _startModalChrono();
    }
  }
  if (tipo === 'final') {
    // Si el usuario marca 'Continuar' -> iniciar/continuar cronómetro desde el tiempo acumulado
    if (valorSelect === 'Continuar') {
      // Si el usuario editó manualmente el campo edit-tiempo, usar ese valor como base
      try {
        const tEl = document.getElementById('edit-tiempo');
        if (tEl && tEl.value) {
          const hhmmss = String(tEl.value).trim().match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
          if (hhmmss) {
            const hrs = Number(hhmmss[1]);
            const mins = Number(hhmmss[2]);
            const secs = Number(hhmmss[3]);
            _modalElapsedSeconds = hrs * 3600 + mins * 60 + secs;
          }
        }
      } catch (e) { /* ignore parse errors and use existing _modalElapsedSeconds */ }
      // Iniciar el cronómetro desde el tiempo guardado en _modalElapsedSeconds
      _startModalChrono();
      return;
    }

    // Si el usuario marca 'En proceso' en final, tratar como continuar (iniciar)
    if (valorSelect === 'En proceso') {
      _startModalChrono();
      return;
    }

    // Si pausa/reasigna/finaliza -> pausar y fijar la hora final y el tiempo final
    if (['En pausa', 'Reasignado', 'Finalizado'].includes(valorSelect)) {
      // Pausar cronómetro y fijar hora final y el tiempo acumulado en edit-tiempo
      _pauseModalChrono();
      const hf = document.getElementById('edit-hora-final');
      if (hf && !hf.value) {
        const ahora = new Date();
        const dd = String(ahora.getDate()).padStart(2, '0');
        const mm = String(ahora.getMonth() + 1).padStart(2, '0');
        const yyyy = ahora.getFullYear();
        const hh = String(ahora.getHours()).padStart(2, '0');
        const min = String(ahora.getMinutes()).padStart(2, '0');
        const ss = String(ahora.getSeconds()).padStart(2, '0');
        hf.value = `${hh}:${min}:${ss} ${dd}/${mm}/${yyyy}`;
      }
      // Escribir el tiempo acumulado (HH:MM:SS) en el campo oculto edit-cronometro para que se guarde
      const cronEl = document.getElementById('edit-cronometro');
      if (cronEl) cronEl.value = _modalFormatHHMMSS(_modalElapsedSeconds);
      // Actualizar visual
      _updateModalChronDisplay();
      return;
    }
  }
}

function calcularDiferenciaModal() {
  const a = document.getElementById('edit-hora-inicio')?.value || '';
  const b = document.getElementById('edit-hora-final')?.value || '';
  const out = document.getElementById('edit-diferencia-horas');
  if (!a || !b) { if (out) out.textContent = ''; return; }
  // Intentar parsear formato HH:MM:SS DD/MM/YYYY y devolver diferencia en HH:MM:SS (horas totales)
  try {
    const parse = (s) => {
      const parts = s.split(' ');
      if (parts.length < 2) return null;
      const time = parts[0].split(':').map(Number);
      const date = parts[1].split('/').map(Number);
      if (time.length < 3 || date.length < 3) return null;
      return new Date(date[2], date[1]-1, date[0], time[0], time[1], time[2]);
    };
    const d1 = parse(a);
    const d2 = parse(b);
    if (!d1 || !d2) { if (out) out.textContent = ''; return; }
    const diff = Math.abs(d2 - d1);
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
  if (out) out.textContent = `Tiempo: ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  } catch (e) { if (out) out.textContent = ''; }
}

// Vincular eventos en load para selects y inputs del modal
window.addEventListener('load', () => {
  const selIni = document.getElementById('edit-inicio');
  const selFin = document.getElementById('edit-final');
  if (selIni) selIni.addEventListener('change', (e) => {
    const v = e.target.value || '';
    if (v === '') return; // ignorar 'Selecciona…'
    colocarHoraModal('inicio');
    colocarHoraModal_tipoControl('inicio', v);
  });
  // Permitir re-seleccionar la misma opción: llamar también en click con pequeño delay
  if (selIni) selIni.addEventListener('click', () => {
    setTimeout(() => {
      try {
        const v = selIni.value || '';
        if (v === '') return;
        colocarHoraModal('inicio');
        colocarHoraModal_tipoControl('inicio', v);
      } catch (e) {}
    }, 150);
  });
  if (selFin) selFin.addEventListener('change', (e) => {
    const v = e.target.value || '';
    if (v === '') return; // ignorar 'Selecciona…'
    colocarHoraModal('final');
    colocarHoraModal_tipoControl('final', v);
  });
  if (selFin) selFin.addEventListener('click', () => {
    setTimeout(() => {
      try {
        const v = selFin.value || '';
        if (v === '') return;
        colocarHoraModal('final');
        colocarHoraModal_tipoControl('final', v);
      } catch (e) {}
    }, 150);
  });
  const hi = document.getElementById('edit-hora-inicio');
  const hf = document.getElementById('edit-hora-final');
  if (hi) hi.addEventListener('input', calcularDiferenciaModal);
  // No recalculamos diferencia; el modal usa sólo el cronómetro
});

window.addEventListener('load', () => {
  generarControlesColumnas();
  poblarSelectorColumnas();
  cargarYMostrar();

  // Buscador - debounce
  const searchInput = document.getElementById('buscador-texto');
  const searchSelect = document.getElementById('buscador-columna');
  const searchFecha = document.getElementById('buscador-fecha');
  const btnClear = document.getElementById('btn-clear-search');
  const debounced = debounce(cargarYMostrar, 200);
  if (searchInput) searchInput.addEventListener('input', debounced);
  if (searchSelect) searchSelect.addEventListener('change', cargarYMostrar);
  if (searchFecha) searchFecha.addEventListener('change', cargarYMostrar);
  if (btnClear) btnClear.addEventListener('click', () => { 
    if (searchInput) searchInput.value = ''; 
    if (searchSelect) searchSelect.value = 'all'; 
    if (searchFecha) searchFecha.value = '';
    cargarYMostrar(); 
  });

  const btnRef = document.getElementById('btn-refrescar');
  const btnVac = document.getElementById('btn-vaciar');

  if (btnRef) btnRef.addEventListener('click', cargarYMostrar);
  if (btnVac) btnVac.addEventListener('click', () => {
    if (!confirm('¿Vaciar todo el historial de registros?')) return;
    localStorage.removeItem('registros');
    cargarYMostrar();
  });
  
  // Vincular actualizaciones del datalist 'detalles' desde los selects de categoría
  const editCategoria = document.getElementById('edit-categoria');
  if (editCategoria) {
    editCategoria.addEventListener('change', () => actualizarDetalleDatalist(editCategoria.value, 'detalles'));
    if (editCategoria.value) actualizarDetalleDatalist(editCategoria.value, 'detalles');
  }
  const categoriaMain = document.getElementById('categoria');
  if (categoriaMain) {
    categoriaMain.addEventListener('change', () => actualizarDetalleDatalist(categoriaMain.value, 'detalles'));
    if (categoriaMain.value) actualizarDetalleDatalist(categoriaMain.value, 'detalles');
  }

  // Listeners: al cambiar detalle (o edit-detalle) actualizar el campo tiempo correspondiente
  const detalleMain = document.getElementById('detalle');
  if (detalleMain) {
    detalleMain.addEventListener('input', function() {
      const tEl = document.getElementById('tiempo');
      if (tEl) tEl.value = getTiempoForDetalle(this.value);
    });
  }
  const detalleEdit = document.getElementById('edit-detalle');
  if (detalleEdit) {
    detalleEdit.addEventListener('input', function() {
      const tEl = document.getElementById('edit-tiempo');
      if (tEl) tEl.value = getTiempoForDetalle(this.value);
    });
  }

  // Botón Acciones
  const btnAcciones = document.getElementById('btn-acciones');
  const accionesList = document.getElementById('acciones-list');
  if (btnAcciones && accionesList) {
    btnAcciones.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const expanded = btnAcciones.getAttribute('aria-expanded') === 'true';
      btnAcciones.setAttribute('aria-expanded', String(!expanded));
      accionesList.style.display = expanded ? 'none' : 'block';
      accionesList.setAttribute('aria-hidden', String(expanded));
    });
    // Cerrar cuando se haga clic fuera
    document.addEventListener('click', (e) => {
      if (!accionesList.contains(e.target) && e.target !== btnAcciones) {
        accionesList.style.display = 'none';
        btnAcciones.setAttribute('aria-expanded', 'false');
        accionesList.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Botón Filtrar por Fecha
  const btnFiltrarFecha = document.getElementById('btn-filtrar-fecha');
  const filtrarFechaList = document.getElementById('filtrar-fecha-list');
  if (btnFiltrarFecha && filtrarFechaList) {
    btnFiltrarFecha.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const expanded = btnFiltrarFecha.getAttribute('aria-expanded') === 'true';
      btnFiltrarFecha.setAttribute('aria-expanded', String(!expanded));
      filtrarFechaList.style.display = expanded ? 'none' : 'block';
      filtrarFechaList.setAttribute('aria-hidden', String(expanded));
    });
    // Cerrar cuando se haga clic fuera
    document.addEventListener('click', (e) => {
      if (!filtrarFechaList.contains(e.target) && e.target !== btnFiltrarFecha) {
        filtrarFechaList.style.display = 'none';
        btnFiltrarFecha.setAttribute('aria-expanded', 'false');
        filtrarFechaList.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Checkboxes de fecha
  const chkFechaInicio = document.getElementById('chk-fecha-inicio');
  const chkFechaFinal = document.getElementById('chk-fecha-final');
  const chkFechaActualizado = document.getElementById('chk-fecha-actualizado');
  if (chkFechaInicio) chkFechaInicio.addEventListener('change', cargarYMostrar);
  if (chkFechaFinal) chkFechaFinal.addEventListener('change', cargarYMostrar);
  if (chkFechaActualizado) chkFechaActualizado.addEventListener('change', cargarYMostrar);

  // Opciones de acciones
  const accionSeleccionarTodo = document.getElementById('accion-seleccionar-todo');
  if (accionSeleccionarTodo) {
    accionSeleccionarTodo.addEventListener('click', () => {
      showSelectionColumn = true;
      selectedRows.clear();
      // Marcar todos
      try {
        const raw = localStorage.getItem('registros');
        const all = raw ? JSON.parse(raw) : [];
        all.forEach((_, idx) => selectedRows.add(idx));
      } catch (e) {}
      cargarYMostrar();
      accionesList.style.display = 'none';
      btnAcciones.setAttribute('aria-expanded', 'false');
    });
  }

  const accionSeleccionar = document.getElementById('accion-seleccionar');
  if (accionSeleccionar) {
    accionSeleccionar.addEventListener('click', () => {
      showSelectionColumn = true;
      cargarYMostrar();
      accionesList.style.display = 'none';
      btnAcciones.setAttribute('aria-expanded', 'false');
    });
  }

  const accionDeseleccionarTodo = document.getElementById('accion-deseleccionar-todo');
  if (accionDeseleccionarTodo) {
    accionDeseleccionarTodo.addEventListener('click', () => {
      if (selectedRows.size === 0 || !showSelectionColumn) {
        // No hacer nada si no hay seleccionadas o no se visualiza la columna
        accionesList.style.display = 'none';
        btnAcciones.setAttribute('aria-expanded', 'false');
        return;
      }
      selectedRows.clear();
      cargarYMostrar();
      accionesList.style.display = 'none';
      btnAcciones.setAttribute('aria-expanded', 'false');
    });
  }

  const accionOcultarSeleccionar = document.getElementById('accion-ocultar-seleccionar');
  if (accionOcultarSeleccionar) {
    accionOcultarSeleccionar.addEventListener('click', () => {
      if (showSelectionColumn) {
        showSelectionColumn = false;
        selectedRows.clear();
        cargarYMostrar();
      }
      accionesList.style.display = 'none';
      btnAcciones.setAttribute('aria-expanded', 'false');
    });
  }

  const accionEliminar = document.getElementById('accion-eliminar');
  if (accionEliminar) {
    accionEliminar.addEventListener('click', () => {
      if (selectedRows.size === 0) {
        alert('No hay filas seleccionadas para eliminar.');
        return;
      }
      if (!confirm('¿Está seguro de eliminar las filas seleccionadas?')) return;
      try {
        const raw = localStorage.getItem('registros');
        const all = raw ? JSON.parse(raw) : [];
        // Ordenar índices descendente para no afectar posiciones
        const indices = Array.from(selectedRows).sort((a,b) => b - a);
        indices.forEach(idx => all.splice(idx, 1));
        localStorage.setItem('registros', JSON.stringify(all));
        selectedRows.clear();
        showSelectionColumn = false;
      } catch (e) { console.error(e); }
      cargarYMostrar();
      accionesList.style.display = 'none';
      btnAcciones.setAttribute('aria-expanded', 'false');
    });
  }

  const accionDuplicar = document.getElementById('accion-duplicar');
  if (accionDuplicar) {
    accionDuplicar.addEventListener('click', () => {
      if (selectedRows.size === 0) {
        alert('No hay filas seleccionadas para duplicar.');
        return;
      }
      if (!confirm('¿Está seguro de duplicar las filas seleccionadas?')) return;
      try {
        const raw = localStorage.getItem('registros');
        const all = raw ? JSON.parse(raw) : [];
        const toDuplicate = Array.from(selectedRows).map(idx => all[idx]).filter(Boolean);
        toDuplicate.forEach(fila => {
          const nuevaFila = [...fila];
          // Dejar en blanco Inicio, Estado Inicio, Final, Estado Final, Actualizado, Tiempo
          nuevaFila[0] = ''; // Inicio
          nuevaFila[1] = ''; // Estado Inicio
          nuevaFila[2] = ''; // Final
          nuevaFila[3] = ''; // Estado Final
          nuevaFila[18] = ''; // Actualizado
          nuevaFila[19] = ''; // Tiempo
          all.push(nuevaFila);
        });
        localStorage.setItem('registros', JSON.stringify(all));
        selectedRows.clear();
        showSelectionColumn = false;
      } catch (e) { console.error(e); }
      cargarYMostrar();
      accionesList.style.display = 'none';
      btnAcciones.setAttribute('aria-expanded', 'false');
    });
  }

  const accionImportarDatos = document.getElementById('accion-importar-datos');
  if (accionImportarDatos) {
    accionImportarDatos.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xlsm';
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (json.length < 2) {
              alert('El archivo no tiene suficientes filas.');
              return;
            }

            // Verificar encabezados
            const expectedHeaders = [
              "Inicio", "Estado de Inicio", "Final", "Estado Final", "Nombre", "Acciones", "Detalle de Solicitud", "Fallas", "Descripción", "Comentarios", "Tiempo de Gestión", "Nuevo o Actualizado", "Cant Documentos", "Categoría", "Analista/Área", "Nombre de Documento", "Asignado a", "Prioridad", "Actualizado", "Tiempo (cronómetro)"
            ];
            const headers = json[0];
            for (let i = 0; i < expectedHeaders.length; i++) {
              if (headers[i] !== expectedHeaders[i]) {
                alert(`Encabezado incorrecto en columna ${String.fromCharCode(65 + i)}1: esperado "${expectedHeaders[i]}", encontrado "${headers[i]}"`);
                return;
              }
            }

            // Extraer datos
            const newRows = [];
            for (let i = 1; i < json.length; i++) {
              const row = json[i];
              if (row.length < 20) continue; // Saltar filas incompletas
              const newRow = row.slice(0, 20);
              // Convertir fechas
              newRow[0] = formatDateTime(newRow[0]); // Inicio
              newRow[2] = formatDateTime(newRow[2]); // Final
              newRow[18] = formatDateTime(newRow[18]); // Actualizado
              newRows.push(newRow);
            }

            if (newRows.length === 0) {
              alert('No se encontraron filas de datos válidas.');
              return;
            }

            // Agregar al localStorage
            const raw = localStorage.getItem('registros');
            const all = raw ? JSON.parse(raw) : [];
            all.push(...newRows);
            localStorage.setItem('registros', JSON.stringify(all));

            alert(`Se importaron ${newRows.length} registros.`);
            cargarYMostrar();
          } catch (error) {
            console.error(error);
            alert('Error al procesar el archivo: ' + error.message);
          }
        };
        reader.readAsArrayBuffer(file);
      });
      input.click();
      accionesList.style.display = 'none';
      btnAcciones.setAttribute('aria-expanded', 'false');
    });
  }
});
