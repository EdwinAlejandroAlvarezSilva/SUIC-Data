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
   - ✅ Se hace backup automático cada 10 minutos
   - ✅ Si se pierden datos, se restauran automáticamente

**Ventajas:**
- ✅ Sin servidor
- ✅ Sin comando npm
- ✅ Sin permisos de administrador
- ✅ Funciona offline
- ✅ Datos persisten entre navegadores/perfiles
- ✅ **AUTO-BACKUP automático cada 10 minutos (sin hacer nada)**
- ✅ **AUTO-RESTORE automático (si es necesario)**

---

## 📦 OPCIÓN 2: Usar Servidor Express (Si la API falla)

**Si el botón de almacenamiento no aparece o no funciona:**

1. **Busca el archivo** `INICIAR_ALMACENAMIENTO.bat` en tu carpeta SUIC Data
2. **Haz doble clic en él** para abrir (se abrirá una ventana)
3. **Déjalo abierto** mientras usas SUIC Data
4. Ya puedes usar SUIC Data.html y Registros.html normalmente

**Características automáticas:**
- ✅ Datos se guardan automáticamente en `tipificaciones.json`
- ✅ Auto-backup cada 10 minutos (invisiblemente)
- ✅ Auto-restore si algo falla

**Nota:** La primera vez instalará dependencias (espera ~30 segundos)

**Ventajas:**
- ✅ Funciona si File System API está bloqueada
- ✅ Datos en archivo local `tipificaciones.json`
- ✅ **Sincronización automática**
- ✅ **Auto-backup y auto-restore transparente**

---

## 🤖 SISTEMA AUTO-BACKUP/RESTORE (TOTALMENTE AUTOMÁTICO)

**NO NECESITAS HACER NADA. El sistema funciona de forma invisible:**

### ¿Cómo funciona?

- **Auto-Snapshot cada 10 minutos**: El sistema automáticamente guarda una copia de tus datos en la base de datos del navegador (IndexedDB)
- **Mantiene hasta 10 versiones**: Siempre tienes acceso a los últimos 10 snapshots (por si necesitas recuperar datos antiguos)
- **Auto-Restore si falta datos**: Si localStorage se borra (cambio de perfil, etc.), automáticamente se restaura del snapshot más reciente
- **Backup en eventos**: Cada vez que creas/editas/eliminas un registro, se hace un backup inmediato

### ¿Qué pasa si...?

| Evento | Resultado |
|--------|-----------|
| Cierro el navegador | Auto-restore automático al abrir de nuevo |
| Cambio de perfil/cuenta | Auto-restore automático en el nuevo perfil (las veces restantes) |
| Pierdo acceso al almacenamiento | Auto-restore desde el índice más reciente |
| 10 minutos sin cambios | Backup automático por si acaso |
| Edito/Creo/Elimino datos | Backup inmediato + backup periódico |

---

## 🔄 Jerarquía de Almacenamiento (Automática)

El sistema **intenta en este orden** (sin que hagas nada):

```
1. File System Access API (archivo seleccionado)
   ↓ (Si no funciona)
2. Servidor Express (localhost:3000)
   ↓ (Si no funciona)
3. IndexedDB con Auto-Snapshots (backup automático)
   ↓ (Si no funciona)
4. localStorage (temporario)
```

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
5. Cada 10 minutos verás nuevos snapshots
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

