# 🔒 SOLUCIÓN DE ALMACENAMIENTO PARA EMPRESAS (Sin Terminal/PowerShell)

Si estás en una empresa privada **donde no puedes abrir PowerShell/CMD**, este documento te muestra las opciones disponibles.

---

## 📋 OPCIÓN 1: Usar Archivo de Almacenamiento (Recomendado - Sin Servidor)

**Paso a paso:**

1. **Abre SUIC Data.html** en Chrome o Edge (navegador Chromium)
2. **Haz clic en el botón gris** "Usar archivo como Almacenamiento" (esquina inferior derecha)
3. **Elige o crea** un archivo `tipificaciones.json` en tu carpeta
   - Ejemplo: `c:\Users\Tu Usuario\Desktop\tipificaciones.json`
4. **Acepta permisos** (navegador pedirá confirmación una sola vez)
5. **Listo**, a partir de ahora:
   - ✅ Todos tus datos se guardan en ese archivo automáticamente
   - ✅ Se crean snapshots de respaldo en IndexedDB del navegador
   - ✅ Si falla la escritura, se informa el error sin cambiar de almacenamiento

**Ventajas:**
- ✅ Sin servidor
- ✅ Sin comando npm
- ✅ Sin permisos de administrador
- ✅ Funciona offline
- ✅ Datos persisten entre navegadores/perfiles
- ✅ **Snapshots de respaldo periódicos**

---

## 📦 OPCIÓN 2: Usar Servidor Express (Si la API falla)

**Si el botón de almacenamiento no aparece o no funciona y no has seleccionado Archivo Local:**

1. **Busca el archivo** `INICIAR_ALMACENAMIENTO.bat` en tu carpeta SUIC Data
2. **Haz doble clic en él** para abrir (se abrirá una ventana)
3. **Déjalo abierto** mientras usas SUIC Data
4. Ya puedes usar SUIC Data.html y Registros.html normalmente

**Características automáticas:**
- ✅ Datos se guardan automáticamente en `tipificaciones.json`
- ✅ Se crean snapshots de respaldo en IndexedDB del navegador
- ✅ Si el servidor falla, se informa; no se cambia automáticamente de almacenamiento

**Nota:** La primera vez instalará dependencias (espera ~30 segundos)

**Ventajas:**
- ✅ Funciona si File System API está bloqueada
- ✅ Datos en archivo local `tipificaciones.json`
- ✅ **Sincronización automática**
- ✅ **Auto-backup transparente**

---

## 🤖 SISTEMA DE AUTO-BACKUP

El respaldo funciona en segundo plano cuando está activo el modo Archivo Local.

### ¿Cómo funciona?

- **Auto-Snapshot cada 5 minutos**: Se guarda una copia en la base de datos del navegador (IndexedDB)
- **Mantiene hasta 10 versiones**: Siempre tienes acceso a los últimos 10 snapshots (por si necesitas recuperar datos antiguos)
- **Backup en eventos**: También se crea un snapshot tras sincronizar cambios
- **No restaura automáticamente**: Un snapshot antiguo no debe reemplazar datos actuales sin una acción explícita

### ¿Qué pasa si...?

| Evento | Resultado |
|--------|-----------|
| Cierro el navegador | Los snapshots permanecen en IndexedDB de ese perfil |
| Cambio de perfil/cuenta | Los snapshots no se comparten entre perfiles |
| Pierdo acceso al almacenamiento | No se restaura automáticamente un snapshot anterior |
| 5 minutos sin cambios | Se crea un snapshot si Archivo Local está activo |
| Guardo cambios | Se crea un snapshot tras la sincronización |

---

## 🔄 Prioridad del almacenamiento

El modo elegido se mantiene como fuente de datos y no cambia automáticamente a otro
almacenamiento si ocurre un error:

- **Archivo Local:** lee y guarda en el archivo seleccionado; no envía cambios al
  servidor ni usa IndexedDB como almacenamiento alternativo. Si falla el permiso o
  la escritura, se informa el error para evitar que una copia distinta sobrescriba
  el archivo.
- **Disco Local:** usa únicamente `localStorage` en ese navegador/perfil; no lee del
  archivo ni sincroniza con el servidor.
- **Servidor:** se usa cuando no está activo ninguno de los dos modos anteriores.

Los auto-snapshots de respaldo, cuando están habilitados, no sustituyen la fuente
seleccionada ni se restauran automáticamente sobre cambios actuales.

---

## ⚠️ Resolución de Problemas

### "No veo el botón de almacenamiento"
- Tu navegador/empresa bloqueó File System Access API
- **Solución:** Usa el `.bat` (Opción 2)

### "El .bat no funciona"
- Node.js no está instalado
- **Solución:** 
  - Verifica que Node.js esté instalado: abre PowerShell y escribe `node --version`
  - Si no está, instala desde https://nodejs.org (versión LTS recomendada)
  - Después intenta doble clic en el `.bat` de nuevo

### "Tengo datos en un navegador pero no en otro"
- File System API opera **por navegador/perfil**
- **Solución:** Los auto-snapshots se guardan en IndexedDB del navegador, pero al cambiar de perfil, IndexedDB también es específico del perfil
- **Recomendación:** Usa la misma navegador/perfil, o Opción 2 (servidor compartido)

### "¿Cómo veo si hay backups?"
- Presiona **F12 → Consola**
- Busca mensajes con `[auto-backup]`
- Verás: `snapshot guardado: X registros`

---

## 🎯 Recomendación Según Tu Entorno

| Entorno | Recomendación |
|---------|---------------|
| **Hogar/Personal** | Opción 1 (File System API) + Auto-backup |
| **Empresa con restricciones leves** | Opción 2 (.bat) + Auto-backup |
| **Empresa con seguridad estricta** | Opción 2 (.bat) + Auto-backup |
| **Cualquier lugar (máxima seguridad)** | Opción 2 (.bat) con servidor compartido |

---

## 📞 Pasos Rápidos de Prueba

### Prueba Rápida Opción 1:
```
1. Abre SUIC Data.html
2. Clic en "Usar archivo como Almacenamiento"
3. Crea "tipificaciones.json" en tu escritorio
4. Crea una tipificación y guarda
5. Abre el archivo en Notepad → verás el JSON
6. ✅ Si lo ves, la Opción 1 funciona
```

### Prueba Rápida Opción 2:
```
1. Doble clic en INICIAR_ALMACENAMIENTO.bat
2. Espera a que aparezca la ventana
3. Verás "Storage server listening on http://localhost:3000"
4. Abre SUIC Data.html (igual que siempre)
5. Crea datos y verifica que se guardan
6. ✅ Si funciona, la Opción 2 está lista
```

### Verificar Auto-Backup:
```
1. Abre SUIC Data.html
2. Presiona F12 → Consola
3. Busca mensajes [auto-backup]
4. Deberías ver: "snapshot guardado: X registros"
5. Cada 5 minutos verás nuevos snapshots si Archivo Local está activo
6. ✅ Auto-backup funcionando
```

---

## 💡 Tips Importantes

1. **El auto-backup es invisible**: No verás botones ni popups, funciona en background
2. **El archivo seleccionado** SIEMPRE es la "fuente de verdad" (los datos más confiables)
3. **El servidor (.bat) puede quedarse abierto** todo el día sin problemas
4. **Presiona F12** si quieres ver los logs de auto-backup (opcional)
5. **IndexedDB almacena hasta 10 versiones**: Tienes historial de cambios

---

## 📝 Notas Técnicas

- **File System Access API**: Almacenamiento en el disco, manejado por el navegador (sin admin)
- **IndexedDB**: Base de datos del navegador con auto-snapshots (automática, no visible)
- **Auto-Backup**: Sistema de versionado automático (cada 10 min + en eventos)
- **localStorage**: Almacenamiento rápido temporario (por perfil/navegador)
- **Servidor Express**: Ejecuta Node.js localmente (no envía datos a internet)

---

## 🆆 ¿Y si necesito acceso a los archivos de backup directamente?

Los snapshots se guardan en **IndexedDB del navegador** (no son directamente accesibles como archivos).

**Solución**: Usa Opción 2 con el servidor, que guarda datos en `tipificaciones.json` directamente en tu carpeta (editable con Notepad).

---

¿Cuál opción prefieres probar primero? Avísame si algo no funciona y te ayudaré.
