# ⚡ Guía Rápida de Referencia

## Los problemas que fueron resueltos ✅

| Problema | Antes | Ahora |
|----------|-------|-------|
| Cambio de navegador (Chrome → Firefox) | ❌ Crea contraseña nueva | ✅ Usa la misma contraseña |
| Cambio de ruta del archivo HTML | ❌ Crea contraseña nueva | ✅ Usa la misma contraseña |
| Llevar contraseña a otra PC | ❌ Imposible | ✅ Exportar/Importar |

---

## Flujo de Uso Normal

### Primer acceso
```
1. Abres Opciones.html
   ↓
2. Sistema pide: "Configurar contraseña administradora"
   ↓
3. Escribes contraseña + confirmas
   ↓
4. ✅ Contaseña guardada en IndexedDB
```

### Siguientes accesos
```
1. Abres Opciones.html (mismo navegador, misma ruta O diferente)
   ↓
2. ✅ Sistema la encuentra automáticamente
   ↓
3. Pide: "Acceso Administrador"
   ↓
4. Ingresas tu contraseña
   ↓
5. ✅ Acceso concedido
```

---

## Botones que ves en Opciones

### 🔒 Cambiar
- **Qué hace:** Cambia tu contraseña a una nueva
- **Cuándo usarlo:** Si quieres cambiar tu contraseña por seguridad
- **Proceso:** Pide contraseña actual → Nueva contraseña → Confirmar

### 📥 Exportar
- **Qué hace:** Descarga un archivo JSON con tu contraseña cifrada
- **Cuándo usarlo:** Antes de cambiar de computadora o para hacer backup
- **Archivo:** `suic_password_backup_1234567890.json` (se descarga automáticamente)

### 📤 Importar
- **Qué hace:** Carga tu contraseña desde un archivo JSON
- **Cuándo usarlo:** Cuando cambias de navegador/PC y ya tienes el backup
- **Proceso:** Click → Selecciona archivo → ✅ Contraseña restaurada

---

## Escenarios Prácticos

### Escenario 1: Usas Chrome y quieres cambiar a Firefox
```
Chrome:
└─ Abres Opciones.html
   └─ Usas contraseña normalmente

Firefox (mismo PC):
└─ Abres Opciones.html en la misma ruta
└─ ✅ Firefox encuentra tu contraseña automáticamente
   (gracias a IndexedDB que no depende del navegador)
```

### Escenario 2: Mueves los archivos de C:\ a D:\
```
Ubicación anterior: C:\Users\Edwin\Desktop\SUIC Data\Opciones.html
└─ Contraseña guardada

Nueva ubicación: D:\Documentos\SUIC Data\Opciones.html
└─ Abres Opciones.html
└─ ✅ "Acceso Administrador" (no pide crear una nueva)
   (gracias a IndexedDB que no depende de la ruta)
```

### Escenario 3: Cambias de computadora
```
Computadora 1:
1. 🔒 Cambiar → Asegúrate de tener una contraseña
2. 📥 Exportar → Descargas suic_password_backup_1234567890.json
3. Copias el archivo a un pendrive/email/nube

Computadora 2:
1. Abres Opciones.html
2. Sistema pide crear nueva contraseña (primer acceso)
3. 📤 Importar → Selecciona tu archivo del pendrive
4. ✅ Contraseña importada - cierra y abre la página
5. Ingresas tu contraseña original ✅
```

### Escenario 4: Quieres hacer un backup de seguridad
```
1. 📥 Exportar en tu navegador actual
2. Guarda el archivo en 3 lugares:
   - Tu nube (Google Drive, OneDrive, etc.)
   - Un pendrive
   - Tu email
3. ✅ Está protegido 7/7 días
```

---

## Cosas importantes 🛡️

### ✅ Lo que funciona ahora
- ✅ Una contraseña para múltiples navegadores
- ✅ Una contraseña para múltiples rutas del archivo
- ✅ Llevar contraseña entre computadoras con exportar/importar
- ✅ Recuperar contraseña si cambias de dispositivo

### ⚠️ Lo que NO funciona
- ❌ Si borras los datos/cookies del navegador = pierdes la contraseña local
  - (Pero: Solución = tener un backup exportado)
- ❌ Si olvidas tu contraseña completamente = no se puede recuperar
  - (Porque está cifrada unidireccional, es seguridad)
  - (Solución = siempre exporta y guarda el archivo)

### 🔐 Seguridad
- Tu contraseña se cifra con **PBKDF2-SHA256**
- Se usa un **salt aleatorio** de 16 bytes
- Se ejecutan **150,000 iteraciones** (muy difícil de hackear)
- **Nunca está en texto plano** en ningún lado

---

## Acciones de Emergencia

### Mi contraseña no funciona
```
1. ¿Tienes un archivo .json de export?
   SÍ  → 📤 Importar ese archivo
   NO  → Borrar IndexedDB y empezar de nuevo:
        → F12 (DevTools)
        → Storage → IndexedDB
        → Click derecho en SUIC_CONFIG
        → Delete
        → Recarga la página y crea nueva contraseña
        → 📥 INMEDIATAMENTE Exportar para no perder

2. Después de importar/crear:
   → Actualiza la página (F5)
   → Vuelve a ingresar la contraseña
```

### Mi navegador se reinició y pide contraseña de nuevo
```
Normal, IndexedDB está intacto pero necesitas:
1. Ingresar tu contraseña
2. ✅ Sistema la verifica y accedes
```

### Cambié de computadora y no tengo el backup
```
❌ Desafortunadamente no se puede recuperar
   (Por seguridad - la contraseña es unidireccional)

✅ Solución:
1. Borra el almacenamiento (ver "Acciones de Emergencia" arriba)
2. Crea una contraseña nueva
3. 📥 Exporta INMEDIATAMENTE
4. Guarda en 3 lugares diferentes
```

---

## Datos técnicos (para referencia)

**Base de datos:** IndexedDB
- Nombre: `SUIC_CONFIG`
- Tabla/Store: `suic_auth`
- Clave: `password`

**Cifrado:**
- Algoritmo: PBKDF2-SHA256
- Iteraciones: 150,000
- Salt: 16 bytes aleatorio
- Derivación: 256 bits

**Formato de exportación:**
```json
{
  "salt": "base64string...",
  "hash": "base64string...",
  "iterations": 150000
}
```

---

## Checklist de Seguridad ✓

- [ ] Creé una contraseña fuerte (mayúsculas, minúsculas, números, símbolos)
- [ ] Exporté mi contraseña como backup
- [ ] Guardé el archivo de export en 2+ lugares seguros
- [ ] No compartí el archivo de export con nadie
- [ ] La contraseña solo la sé yo
- [ ] Probé abrir Opciones en otro navegador/ruta ✅

**Si marcaste todo:** ¡Tu sistema está seguro! 🔐
