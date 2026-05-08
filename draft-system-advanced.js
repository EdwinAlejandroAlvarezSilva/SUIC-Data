/**
 * SISTEMA AVANZADO DE AUTO-BORRADOR CON MÚLTIPLES CAPAS DE ALMACENAMIENTO
 * 
 * Características:
 * - Guarda automáticamente borradores cada 3 segundos
 * - Restaura borradores automáticamente al cargar la página
 * - Soporta múltiples borradores (por ID de tipificación)
 * - Guarda y restaura el cronómetro exacto (tiempo muy importante)
 * - Sincronización entre pestañas
 * - Respaldo en IndexedDB
 * - Funciona en SUIC Data.html y Registros.html con tipificaciones
 */

(function() {
  'use strict';
  
  const CONFIG = {
    STORAGE_PREFIX: 'suic_draft_v2',
    AUTOSAVE_INTERVAL: 3000, // 3 segundos
    AUTOSAVE_KEY: 'autosave_enabled',
    ACTIVE_DRAFT_KEY: 'suic_active_draft_id', // Prefijo para IDs activos por contexto
    IDB_NAME: 'suic_drafts_db',
    IDB_STORE: 'drafts',
    SYNC_CHECK_INTERVAL: 1000 // Verificar cambios cada 1 segundo
  };

  let draftSystem = {
    currentDraftId: null,
    autoSaveInterval: null,
    syncCheckInterval: null,
    lastSyncHash: null,
    isRestoring: false,
    chronoState: {
      elapsedSeconds: 0,
      running: false,
      lastStartTs: null
    }
  };

  /**
   * Generar ID único para un borrador basado en formulario actual
   * Útil para tipificaciones diferentes o instancias de formulario
   */
  function generateDraftId(contextKey = null) {
    const key = contextKey || getDraftContextKey();
    return `${key}:${Date.now()}`;
  }

  /**
   * Obtener ID de borrador activo o crear uno nuevo
   */
  function getOrCreateDraftId() {
    if (draftSystem.currentDraftId) {
      return draftSystem.currentDraftId;
    }

    try {
      const contextKey = getDraftContextKey();
      const activeStorageKey = getActiveDraftStorageKey(contextKey);
      let activeDraftId = localStorage.getItem(activeStorageKey);
      if (!activeDraftId) {
        activeDraftId = getDraftIdForContext(contextKey) || generateDraftId(contextKey);
        try { localStorage.setItem(activeStorageKey, activeDraftId); } catch (e) { /* ignore */ }
      }
      draftSystem.currentDraftId = activeDraftId;
      return activeDraftId;
    } catch (e) {
      console.warn('[draft-system] error generando draft ID:', e.message);
      return 'fallback:' + Date.now();
    }
  }

  /**
   * Obtener clave de almacenamiento para un borrador específico
   */
  function getDraftStorageKey(draftId = null) {
    const id = draftId || getOrCreateDraftId();
    return `${CONFIG.STORAGE_PREFIX}:${id}`;
  }

  function normalizeContextValue(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
  }

  function isRegistrosPage() {
    const page = (window.location.pathname.split('/').pop() || '').toLowerCase();
    return page.includes('registros');
  }

  function getRegistrosModalContext() {
    const modal = document.getElementById('edit-modal');
    const modalIndex = modal?.dataset?.editIndex ? String(modal.dataset.editIndex).trim() : '';
    if (modalIndex) {
      return `modal:${modalIndex}`;
    }

    const nombre = normalizeContextValue(document.getElementById('edit-nombre')?.value || '');
    const documento = normalizeContextValue(document.getElementById('edit-documento')?.value || '');
    if (nombre || documento) {
      return `modal:${nombre || documento}`;
    }

    return null;
  }

  function getDraftContextKey() {
    const page = window.location.pathname.split('/').pop() || 'unknown';
    if (isRegistrosPage()) {
      const modalContext = getRegistrosModalContext();
      return modalContext ? `${page}:${modalContext}` : null;
    }

    const category = normalizeContextValue(document.getElementById('categoria')?.value || '');
    const nombre = normalizeContextValue(document.getElementById('nombre')?.value || '');
    const documento = normalizeContextValue(document.getElementById('documento')?.value || '');
    const parts = [page, category || 'default'];
    if (nombre) parts.push(nombre);
    if (documento) parts.push(documento);
    return parts.join(':');
  }

  function getActiveDraftStorageKey(contextKey = null) {
    const key = contextKey || getDraftContextKey();
    return `${CONFIG.ACTIVE_DRAFT_KEY}:${key}`;
  }

  function findLatestDraftForContext(contextKey) {
    const drafts = listAllDrafts();
    return drafts.find(draft => draft.contextKey === contextKey);
  }

  function findLatestDraftForPage(pageName) {
    const drafts = listAllDrafts();
    return drafts.find(draft => draft.page === pageName);
  }

  function getDraftIdForContext(contextKey = null) {
    try {
      const key = contextKey || getDraftContextKey();
      if (!key) return null;
      const activeKey = getActiveDraftStorageKey(key);
      const stored = localStorage.getItem(activeKey);
      if (stored) return stored;
      const latestContext = findLatestDraftForContext(key);
      if (latestContext) return latestContext.id;
      const page = window.location.pathname.split('/').pop();
      const latestPage = findLatestDraftForPage(page);
      return latestPage ? latestPage.id : null;
    } catch (e) {
      return null;
    }
  }

  function setAutoSaveEnabled(value) {
    try { localStorage.setItem(CONFIG.AUTOSAVE_KEY, value ? '1' : '0'); } catch (e) {}
  }

  function isAutoSaveEnabled() {
    try { return localStorage.getItem(CONFIG.AUTOSAVE_KEY) === '1'; } catch (e) { return false; }
  }

  function shouldAutoSave() {
    return isAutoSaveEnabled();
  }

  function updateToggleButton() {
    const btn = document.getElementById('toggle-autodelete');
    const ico = document.getElementById('autodel-icon');
    if (!btn) return;
    if (isAutoSaveEnabled()) {
      btn.classList.add('active');
      btn.title = 'Autoguardado: activado';
      if (ico) ico.textContent = '🧾';
    } else {
      btn.classList.remove('active');
      btn.title = 'Autoguardado: desactivado';
      if (ico) ico.textContent = '🚫';
    }
  }

  function initAutoSaveToggle() {
    const attachToggle = () => {
      updateToggleButton();
      const btn = document.getElementById('toggle-autodelete');
      if (!btn) return false;
      btn.addEventListener('click', () => {
        const enabled = !isAutoSaveEnabled();
        setAutoSaveEnabled(enabled);
        updateToggleButton();
        if (enabled) {
          if (typeof window.DraftSystem !== 'undefined' && window.DraftSystem.startAutoSave) {
            window.DraftSystem.startAutoSave();
            if (typeof window.DraftSystem.restore === 'function') {
              window.DraftSystem.restore();
            }
          }
        } else {
          if (typeof window.DraftSystem !== 'undefined' && window.DraftSystem.stopAutoSave) {
            window.DraftSystem.stopAutoSave();
          }
        }
      });
      return true;
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        attachToggle();
      }, { once: true });
    } else {
      attachToggle();
    }
  }

  /**
   * Serializar todos los campos del formulario
   */
  function isDraftFieldExcluded(el) {
    if (!el) return false;
    const id = String(el.id || '').toLowerCase();
    const excludedIds = [
      'buscador-texto', 'buscador-columna', 'buscador-fecha',
      'chk-fecha-inicio', 'chk-fecha-final', 'chk-fecha-actualizado',
      'btn-column-filters', 'btn-clear-search', 'column-filters',
      'column-filters-list', 'filtrar-fecha-list', 'acciones-list',
      'filtros', 'filter', 'buscador'
    ];
    if (excludedIds.some(prefix => id === prefix || id.startsWith(prefix))) return true;
    if (el.closest('.filter-dropdown') || el.closest('.column-filters-dropdown') || el.closest('#column-filters') || el.closest('#column-filters-list')) return true;
    return false;
  }

  function serializeFormFields() {
    const data = {};
    try {
      document.querySelectorAll('input, textarea, select').forEach(el => {
        if (!el.id || el.style.display === 'none' || isDraftFieldExcluded(el)) return;
        
        try {
          if (el.tagName === 'SELECT') {
            data[el.id] = {
              type: 'select',
              value: el.value,
              selectedIndex: el.selectedIndex,
              text: el.options[el.selectedIndex]?.text || ''
            };
          } else if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
            data[el.id] = {
              type: 'input',
              value: el.value
            };
          }
        } catch (e) {
          // Ignorar elementos problemáticos
        }
      });
    } catch (e) {
      console.warn('[draft-system] error serializando campos:', e.message);
    }
    return data;
  }

  /**
   * Restaurar campos del formulario desde datos serializados
   */
  function restoreFormFields(data) {
    if (!data || typeof data !== 'object') return;
    
    try {
      Object.entries(data).forEach(([id, info]) => {
        const el = document.getElementById(id);
        if (!el || isDraftFieldExcluded(el)) return;
        
        try {
          if (info.type === 'select') {
            if (typeof info.selectedIndex === 'number' && el.options[info.selectedIndex]) {
              el.selectedIndex = info.selectedIndex;
            } else {
              el.value = info.value || '';
            }
            // Disparar eventos de cambio para UI actualizada
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('input', { bubbles: true }));
          } else if (info.type === 'input') {
            el.value = info.value || '';
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } catch (e) {
          // Ignorar errores en campo individual
        }
      });
    } catch (e) {
      console.warn('[draft-system] error restaurando campos:', e.message);
    }
  }

  /**
   * Obtener estado actual del cronómetro
   */
  function getCurrentCronoState() {
    const state = { ...draftSystem.chronoState };
    
    // Si el cronómetro está corriendo, incluir el tiempo transcurrido
    if (state.running && state.lastStartTs) {
      state.elapsedSeconds += Math.floor((Date.now() - state.lastStartTs) / 1000);
      state.lastStartTs = Date.now(); // Reiniciar timestamp para próximas comparaciones
    }
    
    return state;
  }

  /**
   * Guardar un borrador completo (campos + cronómetro)
   */
  function saveDraft(draftId = null) {
    const contextKey = getDraftContextKey();
    if (!contextKey) return false;
    const id = draftId || getOrCreateDraftId();
    
    try {
      const draft = {
        id: id,
        contextKey: contextKey,
        timestamp: Date.now(),
        page: window.location.pathname.split('/').pop(),
        fields: serializeFormFields(),
        chrono: getCurrentCronoState(),
        version: 2 // Para detectar versiones antiguas
      };
      
      const storageKey = getDraftStorageKey(id);
      
      // Guardar en localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft));
        // También guardar timestamp para búsqueda rápida
        localStorage.setItem(`${storageKey}:ts`, String(draft.timestamp));
      } catch (e) {
        console.warn('[draft-system] localStorage quota exceeded:', e.message);
      }
      
      // Guardar también en IndexedDB como respaldo
      saveToIndexedDB(id, draft).catch(e => {
        console.warn('[draft-system] error en IndexedDB:', e.message);
      });
      
      // Disparar evento para que otros componentes sepan que se guardó
      window.dispatchEvent(new CustomEvent('draft:saved', {
        detail: { draftId: id, timestamp: draft.timestamp }
      }));
      
      return true;
    } catch (e) {
      console.warn('[draft-system] error guardando borrador:', e.message);
      return false;
    }
  }

  /**
   * Restaurar un borrador completo
   */
  function restoreDraft(draftId = null) {
    const id = draftId || getOrCreateDraftId();
    draftSystem.isRestoring = true;
    
    try {
      const storageKey = getDraftStorageKey(id);
      const draftJson = localStorage.getItem(storageKey);
      
      if (!draftJson) {
        draftSystem.isRestoring = false;
        return false;
      }
      
      const draft = JSON.parse(draftJson);
      if (!draft) {
        draftSystem.isRestoring = false;
        return false;
      }
      
      // Restaurar campos del formulario
      if (draft.fields) {
        restoreFormFields(draft.fields);
      }
      
      // Restaurar estado del cronómetro
      if (draft.chrono) {
        try {
          // Restaurar el tiempo exacto guardado, pero dejarlo detenido
          draftSystem.chronoState = {
            elapsedSeconds: Number(draft.chrono.elapsedSeconds) || 0,
            running: false,
            lastStartTs: null
          };
          applyChronoToGlobal();
        } catch (e) {
          console.warn('[draft-system] error restaurando cronómetro:', e.message);
        }
      }
      
      // Disparar evento de restauración
      window.dispatchEvent(new CustomEvent('draft:restored', {
        detail: { draftId: id, timestamp: draft.timestamp }
      }));
      
      draftSystem.isRestoring = false;
      return true;
    } catch (e) {
      console.warn('[draft-system] error restaurando borrador:', e.message);
      draftSystem.isRestoring = false;
      return false;
    }
  }

  /**
   * Limpiar un borrador específico
   */
  function clearDraft(draftId = null) {
    const id = draftId || getOrCreateDraftId();
    
    try {
      const storageKey = getDraftStorageKey(id);
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}:ts`);
      
      // Limpiar de IndexedDB también
      deleteFromIndexedDB(id).catch(e => {
        console.warn('[draft-system] error limpiando IndexedDB:', e.message);
      });
      
      // Disparar evento de limpieza
      window.dispatchEvent(new CustomEvent('draft:cleared', {
        detail: { draftId: id }
      }));
      
      return true;
    } catch (e) {
      console.warn('[draft-system] error limpiando borrador:', e.message);
      return false;
    }
  }

  /**
   * Obtener lista de todos los borradores guardados
   */
  function listAllDrafts() {
    const drafts = [];
    try {
      const prefix = `${CONFIG.STORAGE_PREFIX}:`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix) && !key.endsWith(':ts')) {
          try {
            const draft = JSON.parse(localStorage.getItem(key));
            if (draft && draft.version >= 2) {
              drafts.push(draft);
            }
          } catch (e) {
            // Ignorar entradas corruptas
          }
        }
      }
    } catch (e) {
      console.warn('[draft-system] error listando borradores:', e.message);
    }
    
    // Ordenar por timestamp descendente (más recientes primero)
    return drafts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  /**
   * INDEXEDDB - Abrir conexión
   */
  function openIndexedDB() {
    return new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(CONFIG.IDB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(CONFIG.IDB_STORE)) {
            db.createObjectStore(CONFIG.IDB_STORE);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * INDEXEDDB - Guardar borrador
   */
  function saveToIndexedDB(draftId, draftData) {
    return openIndexedDB()
      .then(db => {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(CONFIG.IDB_STORE, 'readwrite');
            const store = tx.objectStore(CONFIG.IDB_STORE);
            const key = `draft:${draftId}`;
            store.put(draftData, key);
            tx.oncomplete = () => {
              db.close();
              resolve(true);
            };
            tx.onerror = () => {
              db.close();
              resolve(false);
            };
          } catch (e) {
            db.close();
            resolve(false);
          }
        });
      })
      .catch(e => {
        console.warn('[draft-system] IndexedDB no disponible:', e.message);
        return false;
      });
  }

  /**
   * INDEXEDDB - Restaurar borrador
   */
  function restoreFromIndexedDB(draftId) {
    return openIndexedDB()
      .then(db => {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(CONFIG.IDB_STORE, 'readonly');
            const store = tx.objectStore(CONFIG.IDB_STORE);
            const key = `draft:${draftId}`;
            const req = store.get(key);
            req.onsuccess = () => {
              db.close();
              resolve(req.result || null);
            };
            req.onerror = () => {
              db.close();
              resolve(null);
            };
          } catch (e) {
            db.close();
            resolve(null);
          }
        });
      })
      .catch(e => {
        console.warn('[draft-system] IndexedDB no disponible:', e.message);
        return null;
      });
  }

  /**
   * INDEXEDDB - Eliminar borrador
   */
  function deleteFromIndexedDB(draftId) {
    return openIndexedDB()
      .then(db => {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(CONFIG.IDB_STORE, 'readwrite');
            const store = tx.objectStore(CONFIG.IDB_STORE);
            const key = `draft:${draftId}`;
            store.delete(key);
            tx.oncomplete = () => {
              db.close();
              resolve(true);
            };
            tx.onerror = () => {
              db.close();
              resolve(false);
            };
          } catch (e) {
            db.close();
            resolve(false);
          }
        });
      })
      .catch(e => false);
  }

  /**
   * Sincronizar estado del cronómetro desde variables globales (codigo.js)
   */
  function syncChronoFromGlobal() {
    try {
      if (typeof _elapsedSeconds !== 'undefined') {
        draftSystem.chronoState.elapsedSeconds = Number(_elapsedSeconds) || 0;
      }
      if (typeof _running !== 'undefined') {
        draftSystem.chronoState.running = !!_running;
      }
      if (typeof _lastStartTs !== 'undefined') {
        draftSystem.chronoState.lastStartTs = _lastStartTs ? Number(_lastStartTs) : null;
      }
    } catch (e) {
      console.warn('[draft-system] error sincronizando cronómetro global:', e.message);
    }
  }

  /**
   * Aplicar estado del cronómetro a variables globales (codigo.js)
   */
  function applyChronoToGlobal() {
    try {
      if (typeof _elapsedSeconds !== 'undefined') {
        _elapsedSeconds = Number(draftSystem.chronoState.elapsedSeconds) || 0;
      }
      if (typeof _running !== 'undefined') {
        _running = Boolean(draftSystem.chronoState.running);
      }
      if (typeof _lastStartTs !== 'undefined') {
        _lastStartTs = draftSystem.chronoState.lastStartTs ? Number(draftSystem.chronoState.lastStartTs) : null;
      }
      if (typeof _updateChronDisplay === 'function') {
        _updateChronDisplay();
      }
    } catch (e) {
      console.warn('[draft-system] error aplicando cronómetro global:', e.message);
    }
  }

  /**
   * Inicializar auto-guardado periódico
   */
  function startAutoSave() {
    if (draftSystem.autoSaveInterval || !shouldAutoSave()) return; // Ya está activo o no está habilitado
    
    draftSystem.autoSaveInterval = setInterval(() => {
      if (!draftSystem.isRestoring && shouldAutoSave()) {
        syncChronoFromGlobal();
        saveDraft();
      }
    }, CONFIG.AUTOSAVE_INTERVAL);
  }

  /**
   * Detener auto-guardado
   */
  function stopAutoSave() {
    if (draftSystem.autoSaveInterval) {
      clearInterval(draftSystem.autoSaveInterval);
      draftSystem.autoSaveInterval = null;
    }
  }

  /**
   * Inicializar sincronización entre pestañas
   */
  function initTabSync() {
    // Escuchar cambios en localStorage desde otras pestañas
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith(`${CONFIG.STORAGE_PREFIX}:`)) {
        try {
          const newDraft = JSON.parse(event.newValue);
          if (newDraft && event.oldValue !== event.newValue) {
            // Otro tab guardó un cambio, restaurarlo si es el draft actual
            if (newDraft.id === draftSystem.currentDraftId) {
              restoreDraft(newDraft.id);
            }
          }
        } catch (e) {
          // Ignorar cambios malformados
        }
      }
    });
  }

  /**
   * Inicializar evento de cierre/cambio de pestaña
   */
  function initUnloadHandlers() {
    // Guardar borrador cuando se cierre o abandone la página
    window.addEventListener('beforeunload', () => {
      if (!shouldAutoSave()) return;
      syncChronoFromGlobal();
      saveDraft();
    });
    
    // Guardar cuando la pestaña pierda visibilidad
    document.addEventListener('visibilitychange', () => {
      if (!shouldAutoSave()) return;
      if (document.hidden) {
        syncChronoFromGlobal();
        saveDraft();
      }
    });
    
    // Guardar cuando la ventana pierda foco
    window.addEventListener('blur', () => {
      if (!shouldAutoSave()) return;
      syncChronoFromGlobal();
      saveDraft();
    });
  }

  /**
   * Inicializar restauración automática al cargar página
   */
  function initAutoRestore() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', performAutoRestore);
    } else {
      // DOM ya está listo
      performAutoRestore();
    }
  }

  /**
   * Realizar restauración automática
   */
  function performAutoRestore() {
    // Pequeño delay para asegurar que otros scripts se hayan cargado
    setTimeout(() => {
      try {
        if (!shouldAutoSave()) return;
        const contextKey = getDraftContextKey();
        const draftId = getDraftIdForContext(contextKey);
        if (!draftId) return;
        restoreDraft(draftId);
        console.info('[draft-system] borrador restaurado automáticamente para contexto:', contextKey);
      } catch (e) {
        console.warn('[draft-system] error en restauración automática:', e.message);
      }
    }, 100);
  }

  /**
   * API PÚBLICA - Exponer funciones globales
   */
  window.DraftSystem = {
    // Funciones principales
    save: saveDraft,
    restore: restoreDraft,
    clear: clearDraft,
    listAll: listAllDrafts,
    getCurrentDraftId: getOrCreateDraftId,
    setCurrentDraftId: (id) => { draftSystem.currentDraftId = id; },
    
    // Estado
    getChronoState: getCurrentCronoState,
    setChronoState: (state) => {
      if (state && typeof state === 'object') {
        draftSystem.chronoState = { ...draftSystem.chronoState, ...state };
      }
    },
    
    // Auto-save control
    startAutoSave: startAutoSave,
    stopAutoSave: stopAutoSave,
    isEnabled: isAutoSaveEnabled,
    setEnabled: setAutoSaveEnabled,
    
    // Config
    config: CONFIG
  };

  /**
   * INICIALIZACIÓN AL CARGAR EL SCRIPT
   */
  try {
    // Inicializar sincronización entre pestañas
    initTabSync();
    
    // Inicializar manejadores de descarga/cambio de pestaña
    initUnloadHandlers();
    
    // Inicializar toggle de autoguardado
    initAutoSaveToggle();
    
    // Iniciar auto-guardado solamente si está habilitado
    if (shouldAutoSave()) {
      startAutoSave();
    }
    
    // Inicializar restauración automática al cargar página
    initAutoRestore();
    
    console.info('[draft-system] Sistema avanzado de auto-borrador inicializado');
  } catch (e) {
    console.error('[draft-system] error durante inicialización:', e.message);
  }
})();
