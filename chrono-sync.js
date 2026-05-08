/**
 * SINCRONIZACIÓN MEJORADA DEL CRONÓMETRO CON DRAFTSYSTEM
 * 
 * Este script se encarga de:
 * - Mantener el cronómetro sincronizado entre codigo.js y DraftSystem
 * - Guardar el cronómetro en cada cambio de estado
 * - Restaurar el cronómetro exacto en cada tipificación
 * - Asegurar que el tiempo se preserve en cualquier escenario
 */

(function() {
  'use strict';
  
  let syncInterval = null;
  let lastSyncState = null;
  let isInitialized = false;
  
  /**
   * Sincronizar estado del cronómetro desde variables globales hacia DraftSystem
   */
  function syncChronoToStorage() {
    try {
      // Verificar si variables globales existen
      if (typeof _elapsedSeconds === 'undefined' || typeof _running === 'undefined') {
        return;
      }
      
      const currentState = {
        elapsedSeconds: _elapsedSeconds,
        running: _running,
        lastStartTs: _lastStartTs || null
      };
      
      // Evitar sincronización innecesaria
      if (lastSyncState && JSON.stringify(lastSyncState) === JSON.stringify(currentState)) {
        return;
      }
      
      lastSyncState = { ...currentState };
      
      // Sincronizar con DraftSystem si está disponible
      if (typeof window.DraftSystem !== 'undefined') {
        try {
          window.DraftSystem.setChronoState(currentState);
          // Guardar inmediatamente el borrador con el nuevo estado
          window.DraftSystem.save();
        } catch (e) {
          console.warn('[chrono-sync] error sincronizando con DraftSystem:', e.message);
        }
      }
    } catch (e) {
      console.warn('[chrono-sync] error en syncChronoToStorage:', e.message);
    }
  }
  
  /**
   * Restaurar estado del cronómetro desde DraftSystem hacia variables globales
   */
  function restoreChronoFromStorage() {
    try {
      if (typeof window.DraftSystem === 'undefined') {
        return;
      }
      
      const state = window.DraftSystem.getChronoState();
      if (!state) return;
      
      // Aplicar estado al cronómetro global
      if (typeof _elapsedSeconds !== 'undefined') {
        _elapsedSeconds = Number(state.elapsedSeconds) || 0;
      }
      if (typeof _running !== 'undefined') {
        _running = Boolean(state.running);
      }
      if (typeof _lastStartTs !== 'undefined') {
        _lastStartTs = state.lastStartTs ? Number(state.lastStartTs) : null;
      }
      
      // Actualizar display
      if (typeof _updateChronDisplay === 'function') {
        _updateChronDisplay();
      }
      
      console.info('[chrono-sync] cronómetro restaurado desde almacenamiento');
    } catch (e) {
      console.warn('[chrono-sync] error restaurando cronómetro:', e.message);
    }
  }
  
  /**
   * Inicializar sincronización continua
   */
  function initializeSync() {
    if (isInitialized) return;
    isInitialized = true;
    
    try {
      // Sincronizar cada 1 segundo (junto con el intervalo de actualización del display)
      syncInterval = setInterval(syncChronoToStorage, 1000);
      
      // Escuchar cambios en campos de selección que controlen el cronómetro
      document.addEventListener('change', (e) => {
        const el = e.target;
        if (!el) return;
        
        // Si el cambio es en campos que controlan el cronómetro
        const id = el.id || '';
        if (id === 'inicio' || id === 'final' || id === 'edit-inicio' || id === 'edit-final') {
          // Dar un pequeño delay para que colocarHora() termine su trabajo
          setTimeout(() => {
            syncChronoToStorage();
          }, 100);
        }
      }, true);
      
      // Escuchar eventos de guardado de borrador
      window.addEventListener('draft:saved', () => {
        syncChronoToStorage();
      });
      
      // Escuchar eventos de restauración de borrador
      window.addEventListener('draft:restored', () => {
        restoreChronoFromStorage();
      });
      
      console.info('[chrono-sync] sincronización de cronómetro inicializada');
    } catch (e) {
      console.error('[chrono-sync] error durante inicialización:', e.message);
    }
  }
  
  /**
   * Detener sincronización
   */
  function stopSync() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  }
  
  /**
   * Mejorar guardado del cronómetro en cada tipificación
   * Esto asegura que al crear una nueva tipificación, el cronómetro anterior se preserve
   */
  function improveFormReset() {
    try {
      // Interceptar función borrarDatos si existe
      if (typeof window.borrarDatos === 'function') {
        const originalBorrarDatos = window.borrarDatos;
        
        window.borrarDatos = function() {
          // Guardar cronómetro ANTES de borrar
          syncChronoToStorage();
          
          // Ejecutar función original
          originalBorrarDatos.call(this);
          
          // El cronómetro se reinicia en la función original, así que resincronizar
          syncChronoToStorage();
        };
      }
    } catch (e) {
      console.warn('[chrono-sync] error mejorando borrarDatos:', e.message);
    }
  }
  
  /**
   * Escuchar cambios en el estado del cronómetro desde codigo.js
   * y guardar automáticamente en DraftSystem
   */
  function improveChronoSave() {
    try {
      // Interceptar _startChrono si existe
      if (typeof window._startChrono === 'function') {
        const original_startChrono = window._startChrono;
        window._startChrono = function(force) {
          original_startChrono.call(this, force);
          setTimeout(() => syncChronoToStorage(), 50);
        };
      }
      
      // Interceptar _pauseChrono si existe
      if (typeof window._pauseChrono === 'function') {
        const original_pauseChrono = window._pauseChrono;
        window._pauseChrono = function() {
          original_pauseChrono.call(this);
          setTimeout(() => syncChronoToStorage(), 50);
        };
      }
      
      // Interceptar _resetChrono si existe
      if (typeof window._resetChrono === 'function') {
        const original_resetChrono = window._resetChrono;
        window._resetChrono = function() {
          original_resetChrono.call(this);
          setTimeout(() => syncChronoToStorage(), 50);
        };
      }
    } catch (e) {
      console.warn('[chrono-sync] error mejorando funciones de cronómetro:', e.message);
    }
  }
  
  /**
   * Inicialización principal
   */
  function initialize() {
    try {
      // Esperar a que DOMContentLoaded se complete
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(initializeSync, 100);
          improveChronoSave();
          improveFormReset();
        });
      } else {
        initializeSync();
        improveChronoSave();
        improveFormReset();
      }
      
      // Limpiar al descargar
      window.addEventListener('beforeunload', stopSync);
      
    } catch (e) {
      console.error('[chrono-sync] error en inicialización principal:', e.message);
    }
  }
  
  // Exponer API pública
  window.ChronoSync = {
    sync: syncChronoToStorage,
    restore: restoreChronoFromStorage,
    initialize: initialize,
    stop: stopSync
  };
  
  // Iniciar automáticamente
  initialize();
  
})();
