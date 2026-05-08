/**
 * SCRIPT DE PRUEBAS PARA VERIFICAR EL SISTEMA DE AUTO-BORRADOR
 * 
 * Instrucciones de uso:
 * 1. Abrir consola (F12)
 * 2. Copiar y ejecutar este script
 * 3. Ver resultados en consola
 */

(function() {
  'use strict';
  
  // Estilos para consola
  const styles = {
    success: 'background: #4CAF50; color: white; padding: 8px; border-radius: 4px;',
    error: 'background: #f44336; color: white; padding: 8px; border-radius: 4px;',
    info: 'background: #2196F3; color: white; padding: 8px; border-radius: 4px;',
    warning: 'background: #ff9800; color: white; padding: 8px; border-radius: 4px;'
  };
  
  function log(message, style = styles.info) {
    console.log(`%c${message}`, style);
  }
  
  log('=== INICIANDO PRUEBAS DEL SISTEMA DE AUTO-BORRADOR ===');
  
  // Prueba 1: Verificar si DraftSystem está cargado
  log('\n[PRUEBA 1] Verificando si DraftSystem está cargado...');
  if (typeof window.DraftSystem === 'undefined') {
    log('❌ ERROR: DraftSystem no está cargado', styles.error);
  } else {
    log('✅ DraftSystem cargado correctamente', styles.success);
  }
  
  // Prueba 2: Verificar si ChronoSync está cargado
  log('\n[PRUEBA 2] Verificando si ChronoSync está cargado...');
  if (typeof window.ChronoSync === 'undefined') {
    log('❌ ERROR: ChronoSync no está cargado', styles.error);
  } else {
    log('✅ ChronoSync cargado correctamente', styles.success);
  }
  
  // Prueba 3: Verificar variables globales del cronómetro
  log('\n[PRUEBA 3] Verificando variables globales del cronómetro...');
  const hasElapsed = typeof _elapsedSeconds !== 'undefined';
  const hasRunning = typeof _running !== 'undefined';
  const hasLastStart = typeof _lastStartTs !== 'undefined';
  
  if (hasElapsed && hasRunning && hasLastStart) {
    log(`✅ Variables globales disponibles:`, styles.success);
    log(`   _elapsedSeconds = ${_elapsedSeconds}`);
    log(`   _running = ${_running}`);
    log(`   _lastStartTs = ${_lastStartTs}`);
  } else {
    log('⚠️ WARNING: Algunas variables globales no están disponibles', styles.warning);
    log(`   _elapsedSeconds: ${hasElapsed ? '✓' : '✗'}`);
    log(`   _running: ${hasRunning ? '✓' : '✗'}`);
    log(`   _lastStartTs: ${hasLastStart ? '✓' : '✗'}`);
  }
  
  // Prueba 4: Verificar localStorage
  log('\n[PRUEBA 4] Verificando almacenamiento en localStorage...');
  try {
    const testKey = 'test_draft_' + Date.now();
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    log('✅ localStorage funciona correctamente', styles.success);
  } catch (e) {
    log(`❌ ERROR con localStorage: ${e.message}`, styles.error);
  }
  
  // Prueba 5: Verificar IndexedDB
  log('\n[PRUEBA 5] Verificando IndexedDB...');
  if (!window.indexedDB) {
    log('❌ ERROR: IndexedDB no disponible en este navegador', styles.error);
  } else {
    log('✅ IndexedDB disponible', styles.success);
  }
  
  // Prueba 6: Listar borradores existentes
  log('\n[PRUEBA 6] Buscando borradores guardados...');
  if (typeof window.DraftSystem !== 'undefined' && window.DraftSystem.listAll) {
    try {
      const drafts = window.DraftSystem.listAll();
      if (drafts.length === 0) {
        log('ℹ️ No hay borradores guardados aún', styles.info);
      } else {
        log(`✅ Se encontraron ${drafts.length} borrador(es):`, styles.success);
        drafts.forEach((draft, idx) => {
          log(`   [${idx + 1}] ID: ${draft.id}`);
          log(`       Página: ${draft.page}`);
          log(`       Timestamp: ${new Date(draft.timestamp).toLocaleString()}`);
          log(`       Campos: ${Object.keys(draft.fields).length}`);
          if (draft.chrono) {
            const horas = Math.floor(draft.chrono.elapsedSeconds / 3600);
            const mins = Math.floor((draft.chrono.elapsedSeconds % 3600) / 60);
            const secs = draft.chrono.elapsedSeconds % 60;
            log(`       Cronómetro: ${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
          }
        });
      }
    } catch (e) {
      log(`⚠️ ERROR listando borradores: ${e.message}`, styles.error);
    }
  }
  
  // Prueba 7: Probar guardado manual
  log('\n[PRUEBA 7] Probando guardado manual de borrador...');
  if (typeof window.DraftSystem !== 'undefined' && window.DraftSystem.save) {
    try {
      window.DraftSystem.save();
      log('✅ Borrador guardado manualmente', styles.success);
      
      const drafts = window.DraftSystem.listAll();
      if (drafts.length > 0) {
        log(`   ℹ️ Total de borradores ahora: ${drafts.length}`);
      }
    } catch (e) {
      log(`❌ ERROR al guardar: ${e.message}`, styles.error);
    }
  }
  
  // Prueba 8: Verificar estado del cronómetro
  log('\n[PRUEBA 8] Verificando estado del cronómetro en DraftSystem...');
  if (typeof window.DraftSystem !== 'undefined' && window.DraftSystem.getChronoState) {
    try {
      const state = window.DraftSystem.getChronoState();
      log('✅ Estado del cronómetro:', styles.success);
      log(`   elapsedSeconds: ${state.elapsedSeconds}`);
      log(`   running: ${state.running}`);
      log(`   lastStartTs: ${state.lastStartTs}`);
    } catch (e) {
      log(`⚠️ ERROR: ${e.message}`, styles.warning);
    }
  }
  
  // Prueba 9: Verificar funciones del cronómetro
  log('\n[PRUEBA 9] Verificando funciones de sincronización del cronómetro...');
  const hasSyncFunc = typeof window.ChronoSync !== 'undefined';
  const hasFormatFunc = typeof _formatHHMMSS !== 'undefined';
  const hasUpdateFunc = typeof _updateChronDisplay !== 'undefined';
  
  if (hasSyncFunc && hasFormatFunc && hasUpdateFunc) {
    log('✅ Todas las funciones de cronómetro disponibles', styles.success);
  } else {
    log('⚠️ Algunas funciones no disponibles:', styles.warning);
    log(`   ChronoSync: ${hasSyncFunc ? '✓' : '✗'}`);
    log(`   _formatHHMMSS: ${hasFormatFunc ? '✓' : '✗'}`);
    log(`   _updateChronDisplay: ${hasUpdateFunc ? '✓' : '✗'}`);
  }
  
  // Prueba 10: Contar campos del formulario
  log('\n[PRUEBA 10] Analizando formulario actual...');
  try {
    const inputs = document.querySelectorAll('input, textarea, select');
    const visibleInputs = Array.from(inputs).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    
    log(`✅ Campos encontrados: ${inputs.length} total, ${visibleInputs.length} visibles`, styles.success);
    
    const fieldTypes = {};
    inputs.forEach(el => {
      const type = el.tagName;
      fieldTypes[type] = (fieldTypes[type] || 0) + 1;
    });
    
    Object.entries(fieldTypes).forEach(([type, count]) => {
      log(`   ${type}: ${count}`);
    });
  } catch (e) {
    log(`⚠️ ERROR analizando formulario: ${e.message}`, styles.warning);
  }
  
  // Resumen final
  log('\n=== RESUMEN DE DIAGNÓSTICO ===', styles.info);
  const allSystemsOk = 
    typeof window.DraftSystem !== 'undefined' &&
    typeof window.ChronoSync !== 'undefined' &&
    hasElapsed && hasRunning && hasLastStart;
  
  if (allSystemsOk) {
    log('✅ TODOS LOS SISTEMAS OPERACIONALES', styles.success);
    log('\n💡 Sugerencias de prueba:');
    log('1. Llena algunos campos del formulario');
    log('2. Iniciar el cronómetro (si existe)');
    log('3. Cierra esta pestaña completamente');
    log('4. Reabre esta página');
    log('5. Verifica que formulario + cronómetro se restauraron');
  } else {
    log('⚠️ ALGUNOS SISTEMAS PUEDEN NO ESTAR FUNCIONANDO CORRECTAMENTE', styles.warning);
    log('Por favor verifica los mensajes de error arriba');
  }
  
  // Funciones útiles para el usuario
  log('\n=== FUNCIONES DISPONIBLES EN CONSOLA ===');
  log('Puedes ejecutar estos comandos:');
  log('• DraftSystem.listAll() - Listar todos los borradores');
  log('• DraftSystem.save() - Guardar borrador actual');
  log('• DraftSystem.restore() - Restaurar último borrador');
  log('• DraftSystem.clear() - Limpiar borrador actual');
  log('• DraftSystem.getChronoState() - Ver estado del cronómetro');
  log('• DraftSystem.getCurrentDraftId() - Ver ID del borrador actual');
  log('• ChronoSync.sync() - Sincronizar cronómetro ahora');
  
})();
