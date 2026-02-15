# 👣 GUÍA PASO A PASO VISUAL

## PASO 1: Primera vez que abres Opciones.html

```
┌────────────────────────────────────────────────────────────┐
│  1. Abre tu navegador (Chrome, Firefox, Edge, Safari)     │
│                                                            │
│  2. Navega a tu carpeta SUIC Data                         │
│                                                            │
│  3. Abre el archivo: Opciones.html                        │
│                                                            │
│     (Doble click o arrastra a navegador)                  │
│                                                            │
│  4. Verás esta pantalla:                                  │
│                                                            │
┌─────────────────────────────────────┐
│  Configurar contraseña administradora│
│  ─────────────────────────────────── │
│                                      │
│  Introduce una contraseña...         │
│                                      │
│  [    ]  ← Contraseña               │
│  [    ]  ← Repetir contraseña       │
│                                      │
│          [ Cancelar ] [ Guardar ]    │
└─────────────────────────────────────┘
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## PASO 2: Crear tu contraseña

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  1️⃣  En el primer campo escribe tu contraseña:            │
│                                                            │
│     ✅ Usa una contraseña FUERTE                           │
│        • Mayúsculas: A-Z                                  │
│        • Minúsculas: a-z                                  │
│        • Números: 1-9                                     │
│        • Símbolos: !@#$%                                  │
│        • Longitud: 12+ caracteres                         │
│                                                            │
│     ❌ NO uses:                                            │
│        • Tu nombre o fecha de nacimiento                  │
│        • Palabras comunes del diccionario                 │
│        • Contraseñas muy simples (12345)                 │
│                                                            │
│  2️⃣  Ejemplo de buena contraseña:                         │
│                                                            │
│     Admin2024@SUIC!                                        │
│     └─ Tiene: mayús, minús, números, símbolo, 15 chars   │
│                                                            │
│  3️⃣  En el segundo campo repite la contraseña:            │
│                                                            │
│     [Admin2024@SUIC!]  ← Primer campo                     │
│     [Admin2024@SUIC!]  ← Segundo campo (IGUAL)            │
│                                                            │
│                                                            │
│  4️⃣  Haz clic en "Guardar"                                │
│                                                            │
│     El sistema cifra tu contraseña con PBKDF2-SHA256      │
│     y la guarda en IndexedDB                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## PASO 3: Contraseña Guardada ✅

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  La pantalla desaparece automáticamente y                 │
│  ves la página de Opciones completamente cargada          │
│                                                            │
│  Ahora puedes:                                             │
│  • Editar las opciones de las listas desplegables         │
│  • Agregar/eliminar opciones                              │
│  • Usar los botones nuevos:                                │
│                                                            │
│    [← Volver] [ Registros ] [📥 Exportar] [📤 Importar] [🔒 Cambiar]
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## PASO 4: Exportar tu contraseña (IMPORTANTE!)

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  HAZLO INMEDIATAMENTE después de crear contraseña        │
│                                                            │
│  1️⃣  En la esquina superior derecha haz clic en:          │
│                                                            │
│     [📥 Exportar]                                         │
│                                                            │
│  2️⃣  Tu navegador descargará un archivo:                 │
│                                                            │
│     suic_password_backup_1707900000000.json   ← Se descarga
│                                                            │
│     Este contiene (cifrado):                              │
│     {                                                      │
│       "salt": "base64-encryptedstring...",                │
│       "hash": "base64-encryptedstring...",                │
│       "iterations": 150000                                │
│     }                                                      │
│                                                            │
│  3️⃣  Guarda este archivo en LUGARES SEGUROS:             │
│                                                            │
│     ✅ OneDrive / Google Drive                             │
│     ✅ Pendrive con contraseña                             │
│     ✅ Email hacia ti mismo                                │
│     ✅ Carpeta sincronizada en nube                        │
│                                                            │
│     Guarda en MÍNIMO 3 UBICACIONES                         │
│                                                            │
│  4️⃣  ¿Por qué?                                             │
│                                                            │
│     Si cambias de navegador/PC/ruta y no tienes           │
│     este archivo, NO podrás recuperar tu contraseña       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## ESCENARIO A: Mismo PC, Diferente Navegador

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ESCENARIO: Usas Chrome y quieres usar Firefox            │
│                                                            │
│  PASO 1: En Chrome (ya tienes contraseña)                 │
│  ────────────────────────────────────────                 │
│                                                            │
│     Abre Opciones.html en Chrome                          │
│     Ingresa tu contraseña ✅                               │
│                                                            │
│     Haz clic en: [📥 Exportar]                            │
│     Descarga: suic_password_backup_123.json               │
│     Guarda en lugar seguro                                │
│                                                            │
│  PASO 2: En Firefox (primera vez)                         │
│  ────────────────────────────────────                     │
│                                                            │
│     Abre Opciones.html en Firefox                         │
│                                                            │
│     Firefox dice: \"Primera vez, crea contraseña\"        │
│     (Esto es normal, Firefox no comparte con Chrome)      │
│                                                            │
│     Ves: [Configurar contraseña administradora]           │
│     ────────────────────────────────────────              │
│         [📤 Importar]  ← Haz clic AQUÍ                   │
│                                                            │
│  PASO 3: Importar contraseña                              │
│  ──────────────────────────────                           │
│                                                            │
│     1. Haz clic en \"Importar\"                            │
│     2. Se abre selector de archivos                       │
│     3. Navega a tu archivo descargado                     │
│     4. Selecciona: suic_password_backup_123.json          │
│     5. Espera mensaje: \"Importado correctamente\"        │
│     6. Actualiza la página (F5)                           │
│                                                            │
│  PASO 4: Usar Firefox                                     │
│  ────────────────────────────                             │
│                                                            │
│     Ahora pide: \"Acceso Administrador\"                  │
│     Ingresa tu contraseña original                        │
│     ✅ Firefox reconoce tu contraseña                     │
│                                                            │
│  ✨ RESULTADO: Chrome Y Firefox con la MISMA contraseña   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## ESCENARIO B: Cambio de Ruta del Archivo

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ESCENARIO: Mueves carpeta de C:\ a D:\                   │
│                                                            │
│  UBICACIÓN ANTES:                                          │
│  C:\Users\Edwin\Desktop\SUIC Data\Opciones.html           │
│                                                            │
│  UBICACIÓN DESPUÉS:                                        │
│  D:\Documentos\ProyectoSUIC\Opciones.html                 │
│                                                            │
│  ──────────────────────────────────────────────────────   │
│                                                            │
│  PASO 1: Copia la carpeta completa a la nueva ruta       │
│  ───────────────────────────────────────────────────     │
│                                                            │
│     Carpeta original: C:\...\SUIC Data\                   │
│     Carpeta nueva:    D:\...\SUIC Data\                   │
│                                                            │
│     (Usa Copiar/Pegar o Cortar/Pegar en Windows)          │
│                                                            │
│  PASO 2: Abre Opciones.html de la nueva ruta             │
│  ───────────────────────────────────────────             │
│                                                            │
│     D:\Documentos\ProyectoSUIC\Opciones.html              │
│     └─ Double click                                       │
│                                                            │
│  PASO 3: ¿Qué pasa?                                       │
│  ─────────────────────                                    │
│                                                            │
│     ✅ No pide \"crea contraseña\"                        │
│     ✅ Pide \"Acceso Administrador\"                      │
│     ✅ Ingresa tu contraseña original                     │
│     ✅ ¡Acceso concedido!                                 │
│                                                            │
│  NOTA: IndexedDB persiste en el navegador                │
│        Aunque cambies ruta, IndexedDB sigue aquí          │
│                                                            │
│  ✨ RESULTADO: La contraseña funciona en la nueva ruta    │
│                No necesita re-crearse                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## ESCENARIO C: Cambio de Computadora

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ESCENARIO: Necesitas llevar contraseña a otra PC         │
│                                                            │
│  PASO 1: En tu PC actual (Windows/Mac)                   │
│  ─────────────────────────────────────                   │
│                                                            │
│     Abre Opciones.html                                    │
│     Ingresa contraseña (si no está en cache)             │
│                                                            │
│     Haz clic: [📥 Exportar]                               │
│         │                                                   │
│         └─ Se descarga: suic_password_backup_XXX.json     │
│                                                            │
│  PASO 2: Hacer copia del archivo                          │
│  ──────────────────────────────                           │
│                                                            │
│     Archivo descargado: C:\Users\...\Downloads\...        │
│                                                            │
│     Opciones:                                              │
│     A) Copiar a pendrive USB                              │
│     B) Enviar por email                                   │
│     C) Subir a Google Drive / OneDrive                    │
│     D) Sincronizar en carpeta Dropbox                     │
│                                                            │
│  PASO 3: En la nueva PC                                   │
│  ────────────────────────────                             │
│                                                            │
│     1. Copia la carpeta SUIC Data completa                │
│     2. Abre Opciones.html                                 │
│     3. Sistema pide: \"Crea contraseña\" (primera vez)   │
│     4. ⚠️  NO crees contraseña aún                        │
│     5. Busca el botón: [📤 Importar]                      │
│     6. Haz clic en Importar                               │
│     7. Selecciona tu archivo: suic_password_backup_...json│
│     8. Espera: \"Importado correctamente\"                │
│     9. Actualiza página (F5)                              │
│     10. Ahora pide: \"Acceso Administrador\"              │
│     11. Ingresa tu contraseña ORIGINAL                    │
│     12. ✅ Acceso concedido                               │
│                                                            │
│  ✨ RESULTADO: La contraseña se sincronizó a otra PC      │
│                Sin necesidad de crearla de nuevo          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## SCENARIO D: Cambiar Contraseña

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ESCENARIO: Quiero cambiar mi contraseña                  │
│                                                            │
│  PASO 1: Abre Opciones.html                               │
│  ──────────────────────                                   │
│                                                            │
│     Ingresa tu contraseña actual                          │
│     Accedes a la página                                   │
│                                                            │
│  PASO 2: Haz clic en el botón                             │
│  ──────────────────────────────────                       │
│                                                            │
│     Esquina superior derecha: [🔒 Cambiar]                │
│                                                            │
│  PASO 3: Aparece diálogo                                  │
│  ────────────────────────────────────                     │
│                                                            │
│  ┌─────────────────────────────────┐                      │
│  │  Cambiar contraseña             │                      │
│  │  ────────────────────────────   │                      │
│  │                                 │                      │
│  │  Contraseña actual:             │                      │
│  │  [________________]             │                      │
│  │                                 │                      │
│  │  Nueva contraseña:              │                      │
│  │  [________________]             │                      │
│  │                                 │                      │
│  │  Repetir nueva contraseña:      │                      │
│  │  [________________]             │                      │
│  │                                 │                      │
│  │  [ Cancelar ] [ Cambiar ]       │                      │
│  └─────────────────────────────────┘                      │
│                                                            │
│  PASO 4: Rellena los campos                               │
│  ──────────────────────────────                           │
│                                                            │
│     1. "Contraseña actual":     [MiContraseña123!]       │
│     2. "Nueva contraseña":      [NuevaPass456@!]         │
│     3. "Repetir":               [NuevaPass456@!]         │
│                                                            │
│  PASO 5: Haz clic en \"Cambiar\"                          │
│  ────────────────────────────────────                     │
│                                                            │
│     El sistema:                                            │
│     1. Verifica que contraseña actual es correcta         │
│     2. Verifica que nuevas coinciden                      │
│     3. Genera nuevo salt (aleatorio)                      │
│     4. Cifra nueva contraseña con PBKDF2                  │
│     5. Guarda en IndexedDB                                │
│     6. Muestra: \"Contraseña cambiada correctamente\"     │
│                                                            │
│  ✨ RESULTADO: Tu nueva contraseña está activa            │
│     Debes usar la nueva en próximos accesos               │
│                                                            │
│  TIP: Exporta INMEDIATAMENTE después:                     │
│       [📥 Exportar]                                       │
│       para tener backup de la nueva contraseña            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## EMERGENCIA: Olvide Mi Contraseña

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ESCENARIO: Olvide mi contraseña                          │
│                                                            │
│  OPCIÓN 1: Tengo archivo de export                        │
│  ────────────────────────────────────                     │
│                                                            │
│     1. F12 (Developer Tools)                               │
│     2. Storage → IndexedDB                                 │
│     3. Busca: SUIC_CONFIG                                 │
│     4. Click derecho → Delete Database                    │
│     5. Cierra DevTools (F12)                              │
│     6. Recarga página (F5)                                │
│     7. Sistema pide: \"Crea contraseña\"                  │
│     8. Haz clic: [📤 Importar]                           │
│     9. Selecciona: suic_password_backup_XXX.json          │
│    10. Importa exitosamente                               │
│    11. Recarga página (F5)                                │
│    12. Ahora pide: \"Acceso Administrador\"               │
│    13. Ingresa tu contraseña original                     │
│    14. ✅ Acceso concedido                                │
│                                                            │
│  OPCIÓN 2: No tengo backup                                │
│  ─────────────────────────────                            │
│                                                            │
│     ❌ Lamentablemente no hay forma de recuperarla        │
│        (Está cifrada unidireccionalente)                  │
│                                                            │
│     ✅ PERO puedes:                                        │
│     1. F12 → Storage → IndexedDB → SUIC_CONFIG → Delete   │
│     2. Recarga página                                     │
│     3. Crea una contraseña NUEVA                          │
│     4. 📥 INMEDIATAMENTE Exporta el archivo              │
│     5. Guarda en múltiples lugares                        │
│                                                            │
│  LECCIÓN: Siempre ten un backup                           │
│            Exporta contraseña apenas la crees             │
│            Guarda en mínimo 3 lugares                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Checklist de Seguridad ✓

```
┌──────────────────────────────────────────────────────────────┐
│  ANTES DE EMPEZAR A USAR: Marca todo                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [ ] Creé una contraseña fuerte (12+ chars, símbolos)      │
│  [ ] Exporté mi contraseña     [📥 Exportar]               │
│  [ ] Guardé el archivo en 3 lugares:                       │
│      [ ] OneDrive / Google Drive / Nube                    │
│      [ ] Pendrive con contraseña                           │
│      [ ] Email enviado a mi mismo                          │
│  [ ] No compartí el archivo de export con nadie            │
│  [ ] Solo yo conozco esta contraseña                       │
│  [ ] Probé abrir en otro navegador/ruta con Importar      │
│  [ ] Entiendo que sin backup no hay recuperación           │
│                                                              │
│  Si marcaste TODO:                                          │
│  ✅ Tu sistema está SEGURO y PROTEGIDO                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Diagrama de Decisión

```
              ┌─ ¿Abro Opciones por primera vez?
              │
              ├─ SÍ  → Pide crear contraseña
              │       └─ Crea y EXPORTA INMEDIATAMENTE
              │
              └─ NO  → ¿Cambié de navegador/PC/ruta?
                      │
                      ├─ SÍ  → ¿Tengo archivo de export?
                      │        │
                      │        ├─ SÍ  → 📤 IMPORTAR
                      │        │
                      │        └─ NO  → Crear nueva y EXPORTAR
                      │
                      └─ NO  → Usa contraseña existente
                              ├─ ¿Quiero cambiar?
                              │  └─ SÍ → 🔒 CAMBIAR
                              │
                              └─ NO → Usa normalmente
```

---

🎉 **¡SIGUE ESTOS PASOS Y TU SISTEMA FUNCIONARÁ PERFECTAMENTE!**
