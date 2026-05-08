# GUÍA DE USO - SISTEMA AVANZADO DE AUTO-BORRADOR

## 📌 ¿QUÉ ES EL AUTO-BORRADOR?

El auto-borrador es un sistema que **guarda automáticamente tu trabajo** mientras llenas los formularios, asegurando que **no pierdas datos bajo ninguna circunstancia**.

---

## 🚀 CARACTERÍSTICAS PRINCIPALES

### ✅ **Guardado Automático**
- Se guarda automáticamente cada 3 segundos
- No necesitas hacer nada, funciona transparentemente
- Detecta cambios en campos y los guarda

### ✅ **Restauración Automática**
- Cuando regresas a una página, tu trabajo se restaura automáticamente
- No necesitas responder preguntas de confirmación
- Todo vuelve exacto como lo dejaste

### ✅ **Preservación del Cronómetro**
- **IMPORTANTE**: El tiempo transcurrido se guarda exactamente
- No se suma tiempo extra
- Al restaurar, muestra el tiempo exacto

### ✅ **Sincronización entre Pestañas**
- Si abres la página en múltiples pestañas, los cambios se sincronizan
- Cambios en una pestaña aparecen en las otras automáticamente

### ✅ **Almacenamiento Múltiple**
- Borradores independientes por tipificación
- Puedes trabajar en varios formularios sin que se interfieran

---

## 📖 ESCENARIOS DE USO

### Escenario 1: Trabajar sin preocupaciones
```
1. Abres SUIC Data.html
2. Empiezas a llenar el formulario
3. Inicias el cronómetro
4. El sistema AUTOMÁTICAMENTE guarda cada 3 segundos
5. ¡No necesitas hacer nada más!
```

### Escenario 2: Cambiar de pestaña
```
1. Estás llenando un formulario en SUIC Data.html
2. Necesitas revisar algo en otra pestaña
3. Al cambiar de pestaña, el borrador se guarda automáticamente
4. Cuando regresas a SUIC Data.html, tu trabajo se restaura
```

### Escenario 3: Cerrar el navegador
```
1. Estás trabajando en un formulario
2. Accidentalmente cierras el navegador
3. Abres el navegador nuevamente días después
4. Al cargar SUIC Data.html, ¡tu trabajo sigue ahí!
```

### Escenario 4: Múltiples tipificaciones
```
1. Llenas Tipificación A (cronómetro: 5 minutos)
2. Guardas la tipificación
3. Comienzas Tipificación B (cronómetro: 0 minutos)
4. Si presionas ATRÁS o cambias de sección
5. El sistema restaura exactamente dónde estabas en Tipificación A
```

---

## ⏱️ CÓMO FUNCIONA EL CRONÓMETRO

### Guardado del Tiempo
```
Mientras trabajas:
├─ El cronómetro corre visible en pantalla
├─ Cada segundo se actualiza
├─ El valor EXACTO se guarda en el sistema cada 3 segundos
└─ El tiempo se preserva incluso si cierras navegador
```

### Restauración del Tiempo
```
Cuando regresas:
├─ Si el cronómetro estaba en PAUSA → Se restaura el tiempo exacto
├─ Si estaba CORRIENDO → Se continúa desde el mismo punto
├─ NO se suma tiempo de inactividad
└─ Resultado: Tu tiempo exacto se preserva
```

**Ejemplo:**
- Trabajas 1 hora 15 minutos (1:15:00)
- Cierras navegador
- Reabre navegador mañana
- Verás exactamente 1:15:00 (no más, no menos)

---

## 🎮 CONTROL Y CONFIGURACIÓN

### Botón de Auto-Borrador (🧾 / 🗑️)

El botón está en la **esquina superior izquierda** bajo el logo:

```
🧾 = Auto-borrador DESACTIVADO (normal)
🗑️ = Auto-borrador ACTIVADO
```

#### ¿Cuándo usar cada modo?

**Modo Normal (🧾 - Desactivado):**
- Es el modo recomendado para la mayoría de usuarios
- Los borradores se guardan automáticamente
- Cualquier borrador se restaura al regresar

**Modo Auto-Borrador (🗑️ - Activado):**
- Los borradores se eliminan automáticamente cuando activas el modo
- No restaura borradores antiguos
- Útil si quieres "limpiar" y empezar fresco

---

## 🔍 VERIFICAR QUÉ ESTÁ GUARDADO

### Desde la Consola (F12)

Abre la consola del navegador (presiona F12) y ejecuta:

```javascript
// Ver todos los borradores guardados
DraftSystem.listAll()

// Ver estado actual del cronómetro
DraftSystem.getChronoState()

// Ver ID del borrador actual
DraftSystem.getCurrentDraftId()
```

### Ejemplo de salida:
```
[
  {
    id: "SUIC Data.html:Tipificación A:1234567890",
    timestamp: 1715081000000,
    page: "SUIC Data.html",
    fields: { nombre: "Juan", acciones: "Consulta", ... },
    chrono: { elapsedSeconds: 3661, running: false, lastStartTs: null }
  }
]
```

---

## 🛠️ ACCIONES MANUALES

Si necesitas control manual (aunque generalmente no es necesario):

### Guardar manualmente
```javascript
DraftSystem.save()
```

### Restaurar manualmente
```javascript
DraftSystem.restore()
```

### Borrar borrador actual
```javascript
DraftSystem.clear()
```

### Ver todos los borradores
```javascript
DraftSystem.listAll()
```

---

## ⚠️ PREGUNTAS FRECUENTES

### P: ¿Se guardan mis datos si cierro la pestaña sin guardar el formulario?
**R:** Sí, completamente. El borrador se guarda automáticamente cada 3 segundos. Si cierras la pestaña, los cambios no guardados en el formulario se mantienen en el borrador.

### P: ¿Mi cronómetro se reinicia si cambio de pestaña?
**R:** No. El cronómetro se guarda exacto en el borrador, y se restaura al mismo valor cuando regresas.

### P: ¿Puedo tener múltiples borradores a la vez?
**R:** Sí, cada tipificación/formulario diferente crea su propio borrador independiente.

### P: ¿Dónde se guardan los borradores?
**R:** En tu navegador:
- **localStorage**: Almacenamiento rápido (5-10MB)
- **IndexedDB**: Respaldo adicional (50MB+)

No se envía a un servidor (a menos que actives sincronización en la nube).

### P: ¿Se pierden los borradores si limpio la caché del navegador?
**R:** Sí, si limpias "Cookies y datos de sitios web", se borran los borradores. Ten cuidado con eso.

### P: ¿Qué pasa si trabajo en la página en múltiples dispositivos?
**R:** Los borradores se guardan locales en cada dispositivo. No se sincronizan automáticamente entre dispositivos (a menos que implementemos sincronización en cloud).

### P: ¿El sistema ralentiza la página?
**R:** No. El guardado cada 3 segundos es muy ligero y no afecta el rendimiento.

---

## 🧪 PROBAR EL SISTEMA

### Test rápido:

1. **Abre SUIC Data.html**
2. **Llena algunos campos** (ejemplo: Nombre, Acciones)
3. **Inicia el cronómetro**
4. **Espera 5 segundos**
5. **Cierra la pestaña completamente**
6. **Reabre la página**
7. **Verifica:**
   - ✅ Los campos siguen llenos
   - ✅ El cronómetro muestra aproximadamente el mismo tiempo

---

## 📊 INFORMACIÓN TÉCNICA

### Estructura del Borrador Guardado
```javascript
{
  id: string,              // Identificador único del borrador
  timestamp: number,       // Cuándo se guardó
  page: string,            // Página actual
  fields: object,          // Datos de cada campo del formulario
  chrono: {                // Estado del cronómetro
    elapsedSeconds: number, // Segundos acumulados
    running: boolean,       // ¿Está corriendo?
    lastStartTs: number     // Última vez que se inició
  },
  version: 2               // Versión del sistema
}
```

### Claves de Almacenamiento
```
localStorage:
  suic_draft_v2:{id}       → Borrador completo
  suic_draft_v2:{id}:ts    → Timestamp de guardado
  suic_active_draft_id     → ID del borrador activo
  autodelete_enabled       → Preferencia de auto-borrador

IndexedDB:
  Base de datos: suic_drafts_db
  Store: drafts
  Clave: draft:{id}
```

---

## 🚨 PROBLEMAS Y SOLUCIONES

### Problema: No se restauran los borradores
**Solución:**
1. Abre consola (F12)
2. Ejecuta: `DraftSystem.listAll()`
3. Si está vacío, verifica que localStorage esté habilitado
4. Prueba nuevamente con `DraftSystem.save()`

### Problema: El cronómetro no se guarda
**Solución:**
1. Verifica que el cronómetro esté visible en pantalla
2. Abre consola: `DraftSystem.getChronoState()`
3. Si está en blanco, quizás las variables globales no se cargaron
4. Recarga la página

### Problema: Demasiados borradores acumulados
**Solución:**
1. Abre consola
2. Ejecuta: `DraftSystem.listAll()`
3. Para borrar todos (⚠️ cuidado): Ejecuta en consola:
   ```javascript
   DraftSystem.listAll().forEach(d => DraftSystem.clear())
   ```

---

## 💡 TIPS Y TRUCOS

### Tip 1: Sincronización entre pestañas
Abre SUIC Data.html en 2 pestañas:
- En Pestaña 1: Cambia un campo
- En Pestaña 2: Se actualiza automáticamente
- Útil para trabajar coordinadamente

### Tip 2: Guardar diferentes versiones de borradores
Aunque el sistema guarda automáticamente, puedes tomar "snapshots":
```javascript
// En consola, cuando quieras preservar una versión
DraftSystem.save()

// Verifica que se guardó
console.log(DraftSystem.listAll())
```

### Tip 3: Monitorear el auto-guardado
Abre consola y verás mensajes como:
```
[draft-system] borrador restaurado automáticamente
[draft-system] Sistema avanzado de auto-borrador inicializado
[chrono-sync] sincronización de cronómetro inicializada
```

---

## 📞 CONTACTO Y SOPORTE

Si encuentras problemas:

1. **Abre Developer Tools** (F12)
2. **Ve a Consola**
3. **Busca mensajes con** `[draft-system]` o `[chrono-sync]`
4. **Copia el mensaje de error**
5. **Contacta al soporte técnico**

---

**Versión**: 2.0 - Sistema Avanzado
**Fecha de actualización**: 7 de mayo de 2026
**Estado**: ✅ Completamente operacional

¡Ahora puedes trabajar sin preocupaciones! 🎉
