/**
 * Utilidades para exportar/importar datos de SUIC Data
 * Permite hacer backup y restaurar sin necesidad de servidor o File System API
 */

// Exportar datos a archivo JSON
function exportarDatos() {
  try {
    let datos = [];
    try {
      const stored = localStorage.getItem('registros');
      if (stored) datos = JSON.parse(stored);
    } catch (e) {
      console.error('Error leyendo datos:', e);
    }

    if (!Array.isArray(datos) || datos.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    // Crear blob con los datos
    const dataStr = JSON.stringify(datos, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });

    // Crear URL temporal y descargar
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tipificaciones_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.info('[export] Datos exportados:', datos.length, 'registros');
    alert(`✅ Exportado correctamente: ${datos.length} registros guardados en archivo.`);
  } catch (e) {
    console.error('[export] Error:', e);
    alert('Error al exportar datos: ' + e.message);
  }
}

// Importar datos desde archivo JSON
function importarDatos() {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.JSON';

    input.addEventListener('change', async (evt) => {
      try {
        const file = evt.target.files[0];
        if (!file) return;

        const text = await file.text();
        const datos = JSON.parse(text);

        if (!Array.isArray(datos)) {
          alert('El archivo debe contener un array JSON válido.');
          return;
        }

        // Preguntar si reemplazar o combinar
        const action = confirm(
          `Se encontraron ${datos.length} registros.\n\n` +
          `¿Reemplazar todos los datos actuales?\n\n` +
          `Aceptar = Reemplazar\nCancelar = Combinar con los existentes`
        );

        let finalData = datos;
        if (!action) {
          // Combinar: agregar los nuevos que no existan (evitar duplicados por ID si existe)
          try {
            const existing = JSON.parse(localStorage.getItem('registros') || '[]');
            if (Array.isArray(existing)) {
              // Combinar simple: agregar todos los nuevos
              finalData = [...existing, ...datos];
              console.info('[import] Combinados:', existing.length, '+', datos.length, '=', finalData.length);
            }
          } catch (e) {
            console.info('[import] Error combinando, usando solo nuevos');
          }
        }

        // Guardar en localStorage
        localStorage.setItem('registros', JSON.stringify(finalData));
        console.info('[import] Datos importados en localStorage:', finalData.length);

        // Sincronizar con almacenamiento persistente
        if (typeof window.syncRegistros === 'function') {
          try {
            await window.syncRegistros(finalData);
            console.info('[import] Sincronización exitosa');
          } catch (e) {
            console.warn('[import] Error sincronizando:', e);
          }
        }

        // Recargar tabla si existe
        if (typeof cargarYMostrar === 'function') {
          cargarYMostrar();
          console.info('[import] Tabla recarada');
        }

        alert(`✅ Importado correctamente: ${finalData.length} registros total.`);
      } catch (e) {
        console.error('[import] Error:', e);
        alert('Error al importar archivo: ' + e.message + '\n\nAsegúrate que es un JSON válido.');
      }
    });

    input.click();
  } catch (e) {
    console.error('[import] Error:', e);
    alert('Error al abrir diálogo de archivo: ' + e.message);
  }
}

// Limpiar todos los datos (con confirmación)
function limpiarTodosDatos() {
  const confirmacion = confirm(
    '⚠️  ADVERTENCIA: Esto eliminará TODOS los registros.\n\n' +
    '¿Estás seguro de que deseas continuar?\n\n' +
    'Se recomienda hacer un backup antes (botón Descargar Datos).'
  );

  if (!confirmacion) return;

  try {
    localStorage.setItem('registros', JSON.stringify([]));
    console.info('[clear] Datos borrados');

    if (typeof window.syncRegistros === 'function') {
      window.syncRegistros([]);
    }

    if (typeof cargarYMostrar === 'function') {
      cargarYMostrar();
    }

    alert('✅ Todos los datos han sido eliminados.');
  } catch (e) {
    console.error('[clear] Error:', e);
    alert('Error al limpiar datos: ' + e.message);
  }
}

// Inyectar botones en la interfaz
function inyectarBotonesExportImport() {
  try {
    // Buscar un contenedor para agregar los botones
    // Intentar en Registros.html primero
    let contenedor = document.querySelector('.header-section, .toolbar, nav');

    // Si no existe, crear un div flotante
    if (!contenedor) {
      contenedor = document.createElement('div');
      contenedor.id = 'backup-buttons-container';
      contenedor.style.cssText = `
        position: fixed;
        top: 60px;
        right: 12px;
        z-index: 9998;
        display: flex;
        gap: 6px;
        flex-direction: column;
      `;
      document.body.appendChild(contenedor);
    } else {
      // Agregar dentro del contenedor encontrado
      const wrapper = document.createElement('div');
      wrapper.id = 'backup-buttons-container';
      wrapper.style.cssText = 'display: flex; gap: 6px; margin: 8px 0;';
      contenedor = wrapper;
      const firstChild = document.querySelector('.header-section, .toolbar, nav');
      if (firstChild) firstChild.parentNode.insertBefore(contenedor, firstChild.nextSibling);
    }

    // Botón Descargar
    const btnDescargar = document.createElement('button');
    btnDescargar.id = 'btn-export-data';
    btnDescargar.type = 'button';
    btnDescargar.textContent = '📥 Descargar Datos';
    btnDescargar.title = 'Descarga todos los registros como archivo JSON';
    btnDescargar.style.cssText = `
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      background: #fff;
      cursor: pointer;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      transition: all 0.2s;
    `;
    btnDescargar.addEventListener('mouseover', () => {
      btnDescargar.style.background = '#f5f5f5';
      btnDescargar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
    });
    btnDescargar.addEventListener('mouseout', () => {
      btnDescargar.style.background = '#fff';
      btnDescargar.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
    });
    btnDescargar.addEventListener('click', exportarDatos);

    // Botón Cargar
    const btnCargar = document.createElement('button');
    btnCargar.id = 'btn-import-data';
    btnCargar.type = 'button';
    btnCargar.textContent = '📤 Cargar Datos';
    btnCargar.title = 'Carga registros desde un archivo JSON';
    btnCargar.style.cssText = `
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      background: #fff;
      cursor: pointer;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      transition: all 0.2s;
    `;
    btnCargar.addEventListener('mouseover', () => {
      btnCargar.style.background = '#f5f5f5';
      btnCargar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
    });
    btnCargar.addEventListener('mouseout', () => {
      btnCargar.style.background = '#fff';
      btnCargar.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
    });
    btnCargar.addEventListener('click', importarDatos);

    contenedor.appendChild(btnDescargar);
    contenedor.appendChild(btnCargar);

    console.info('[backup-ui] Botones inyectados correctamente');
  } catch (e) {
    console.error('[backup-ui] Error inyectando botones:', e);
  }
}

// Auto-inyectar cuando la página carga
document.addEventListener('DOMContentLoaded', () => {
  // Pequeño delay para asegurar que otros scripts ya cargaron
  setTimeout(() => {
    inyectarBotonesExportImport();
  }, 500);
});

// Exponer funciones globalmente
window.exportarDatos = exportarDatos;
window.importarDatos = importarDatos;
window.limpiarTodosDatos = limpiarTodosDatos;

console.info('[data-export] Módulo de exportación/importación cargado');
