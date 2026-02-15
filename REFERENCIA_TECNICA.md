# 🔧 Referencia Técnica Detallada

## Arquitectura del Sistema

### IndexedDB vs localStorage

#### localStorage (Anterior ❌)
```javascript
// Problema: Ligado al dominio/origen
localStorage.setItem('suic_options_auth', JSON.stringify(data));
// En file:// puede no funcionar correctamente
// Diferente en cada navegador
// Diferente si cambias ruta
```

#### IndexedDB (Nuevo ✅)
```javascript
// NoSQL database local al navegador
// Almacena objetos complejos
// Mejor para archivos locales (file://)
// Persiste entre navegadores (en el mismo equipo)
// Más capacidad (>50MB vs 5-10MB de localStorage)
```

---

## Flujo Técnico Detallado

### Inicialización de IndexedDB

```javascript
// 1. Abre/crea la base de datos
const req = indexedDB.open(DB_NAME, DB_VERSION);

// 2. Si es primera vez, crea el object store
req.onupgradeneeded = (e) => {
  const db = e.target.result;
  if(!db.objectStoreNames.contains(AUTH_STORE)){
    db.createObjectStore(AUTH_STORE);  // Sin índices, solo clave
  }
};

// 3. Usa la base de datos
const db = await openDB();
```

### Ciclo de Autenticación

```
PRIMERA VISITA (no hay contraseña):
└─ getFromDB() retorna null
   └─ Muestra "Configurar contraseña"
      └─ Usuario ingresa contraseña
         └─ Se genera salt aleatorio (16 bytes)
            └─ Se deriva contraseña con PBKDF2 (150k iteraciones)
               └─ Se guarda en IndexedDB: { salt, hash, iterations }

VISITAS SIGUIENTES (ya existe contraseña):
└─ getFromDB() retorna { salt, hash, iterations }
   └─ Muestra "Acceso Administrador"
      └─ Usuario ingresa contraseña
         └─ Se deriva con el salt guardado
            └─ Se compara hash
               └─ Correcto? → Acceso aceptado
               └─ Incorrecto? → "Contraseña incorrecta"
```

---

## Funciones Clave

### `openDB()`
```javascript
function openDB(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open('SUIC_CONFIG', 1);
    req.onerror = ()=> reject(req.error);
    req.onsuccess = ()=> resolve(req.result);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains('suic_auth')){
        db.createObjectStore('suic_auth');
      }
    };
  });
}
```
**Propósito:** Abre la BD o la crea si no existe
**Retorna:** Promise<IDBDatabase>

### `getFromDB()`
```javascript
async function getFromDB(){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const trans = db.transaction('suic_auth', 'readonly');
    const store = trans.objectStore('suic_auth');
    const req = store.get('password');
    req.onsuccess = ()=> resolve(req.result);  // Retorna undefined si no existe
  });
}
```
**Propósito:** Lee la contraseña guardada
**Retorna:** Promise<Object|undefined>

### `saveToDB(data)`
```javascript
async function saveToDB(data){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const trans = db.transaction('suic_auth', 'readwrite');
    const store = trans.objectStore('suic_auth');
    const req = store.put(data, 'password');  // Sobrescribe si existe
    req.onsuccess = ()=> resolve(true);
  });
}
```
**Propósito:** Guarda la contraseña en IndexedDB
**Parámetro:** { salt: base64, hash: base64, iterations: number }
**Retorna:** Promise<boolean>

### `derive(password, salt, iterations)`
```javascript
async function derive(password, salt, iterations){
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    {name:'PBKDF2'},
    false,
    ['deriveBits']
  );
  const params = {
    name:'PBKDF2',
    salt: salt,
    iterations: iterations || 100000,
    hash: 'SHA-256'
  };
  const bits = await crypto.subtle.deriveBits(params, key, 256);
  return new Uint8Array(bits);
}
```
**Propósito:** Genera hash de contraseña con PBKDF2
**Parámetros:**
- `password` (string): Contraseña en texto plano
- `salt` (ArrayBuffer): 16 bytes aleatorios
- `iterations` (number): Típicamente 150,000

**Retorna:** Promise<Uint8Array> con 32 bytes (256 bits)

---

## Flujo de Exportar

```javascript
exportPassword: async function(){
  // 1. Obtiene datos de IndexedDB
  const storedData = await getFromDB();
  
  // 2. Convierte a JSON
  const exportData = JSON.stringify(storedData, null, 2);
  
  // 3. Crea Blob (archivo descargable)
  const blob = new Blob([exportData], {type: 'application/json'});
  
  // 4. Genera URL
  const url = URL.createObjectURL(blob);
  
  // 5. Simula descarga
  const a = document.createElement('a');
  a.href = url;
  a.download = `suic_password_backup_${new Date().getTime()}.json`;
  a.click();
  
  // 6. Limpia
  URL.revokeObjectURL(url);
}
```

**Archivo descargado:**
```json
{
  "salt": "AbCdEfGhIjKlMnOpQrStUvWxYz==",
  "hash": "XyZ0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U==",
  "iterations": 150000
}
```

---

## Flujo de Importar

```javascript
importPassword: async function(){
  // 1. Abre selector de archivo
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    // 2. Lee el archivo
    const file = e.target.files[0];
    const text = await file.text();
    
    // 3. Parsea JSON
    const data = JSON.parse(text);
    
    // 4. Valida estructura
    if(!data.salt || !data.hash || !data.iterations){
      alert('Archivo inválido');
      return;
    }
    
    // 5. Guarda en IndexedDB
    await saveToDB(data);
    
    // 6. Pide actualizar página
    alert('Importado. Actualiza la página.');
  };
  
  // 7. Simula click
  input.click();
}
```

---

## Comparación Criptográfica

### Función de Derivación PBKDF2-SHA256

```
Entrada: "MiContraseña123"
Salt: [16 bytes aleatorios]
Iteraciones: 150,000
Hash: SHA-256

Proceso:
1. round_0 = HMAC-SHA256(contraseña, salt)
2. round_1 = HMAC-SHA256(contraseña, round_0)
3. round_2 = HMAC-SHA256(contraseña, round_1)
   ... (150,000 veces)
4. resultado = round_149,999

Tiempo: ~100ms en navegador moderno (buena seguridad vs usabilidad)
```

### Por qué 150,000 iteraciones

- **NIST 2023:** Recomienda mínimo 600,000
- **Nosotros:** 150,000 (compromiso entre seguridad y velocidad en navegador)
- **Ataque de fuerza bruta:** Cada intento toma 100ms
  - 1 millón de intentos = ~27 horas (imposible)

---

## Casos de Uso Técnicos

### Caso 1: Usuario abre Firefox después de Chrome

```
Chrome:
- indexedDB.open('SUIC_CONFIG') [Chrome]
  └─ Almacena: { salt:..., hash:..., iterations:150000 }

Firefox:
- indexedDB.open('SUIC_CONFIG') [Firefox]
  └─ ✅ Firefox tiene SU PROPIA copia de 'SUIC_CONFIG'
  └─ No compartida con Chrome (pero ambos browsers copian a IndexedDB localmente)
  
INCORRECTO: Esto FALLA si no sincronizamos
```

**Solución implementada:**
- Cuando cambias de navegador en el MISMO equipo, Firefox NO heredará de Chrome
- Pero: El usuario puede usar 📤 Importar para llevar su contraseña
- O: Ambos navegadores acceden a archivos locales file:// que podrían tener el mismo IndexedDB

**ACLARACIÓN IMPORTANTE:**
IndexedDB es independiente por navegador. Esto significa:
- Chrome y Firefox en el mismo equipo = IndexedDB separadas
- Solución: Usar Exportar/Importar para sincronizar entre navegadores

---

## Estructura de Base de Datos

```
indexedDB
└─ 'SUIC_CONFIG' (Database)
   └─ 'suic_auth' (Object Store)
      └─ 'password' (Key)
         └─ value: {
              salt: "base64-encoded-16-bytes",
              hash: "base64-encoded-256-bits",
              iterations: 150000
            }
```

### Propiedades de IndexedDB en navegadores

| Navegador | Soporte | Límite |
|-----------|---------|--------|
| Chrome | ✅ Sí | ~50MB |
| Firefox | ✅ Sí | ~50MB |
| Edge | ✅ Sí | ~50MB |
| Safari | ✅ Sí (12+) | ~50MB |
| file:// | ⚠️ Depende | Generalmente OK |

---

## Depuración y Desarrollo

### Ver datos en DevTools de Chrome/Firefox

```javascript
// Console
indexedDB.databases().then(dbs => console.log(dbs));
// Muestra: [{name: 'SUIC_CONFIG', version: 1}]

// O manualmente:
// F12 → Storage → IndexedDB → SUIC_CONFIG → suic_auth
```

### Limpiar datos (para testing)

```javascript
// En console
indexedDB.deleteDatabase('SUIC_CONFIG');
// Luego recargar página
```

### Monitorear derivación de contraseña

```javascript
// Agregar en derive() para medir tiempo
const start = performance.now();
const dh = await crypto.subtle.deriveBits(params, key, 256);
console.log(`Derivation took ${performance.now() - start}ms`);
```

---

## Seguridad: Consideraciones

### ✅ Lo que está bien

1. **Hashing unidireccional:** No se puede recuperar contraseña del hash
2. **Salt aleatorio:** Cada contraseña tiene su propio salt único
3. **Muchas iteraciones:** 150,000 hacen ataques impracticables
4. **PBKDF2-SHA256:** Estándar criptográfico reconocido

### ⚠️ Limitaciones

1. **IndexedDB es local:** Si alguien accede a tu PC, puede ver IndexedDB
2. **No hay autenticación múltiple:** Solo una contraseña
3. **Contraseña en texto plano durante entrada:** Usuario ve su contraseña al escribir
4. **XSS risk:** Si alguien modifica Opciones.html, puede interceptar contraseña

### 🛡️ Recomendaciones

1. Usar contraseña fuerte (12+ caracteres, símbolos)
2. Usar navegador seguro y mantenerlo actualizado
3. No compartir el archivo de export de contraseña
4. Limpiar caché/cookies regularmente si compartes PC
5. Usar HTTPS si se hospeda en servidor (no aplicable a file://)

---

## FAQ Técnico

**P: ¿Por qué IndexedDB y no localStorage?**
R: IndexedDB funciona mejor con file:// y tiene más capacidad (50MB vs 5MB)

**P: ¿Van a estar sincronizadas las contraseñas entre navegadores?**
R: No automáticamente. Cada navegador tiene su IndexedDB. Usar Exportar/Importar.

**P: ¿Qué pasa si cambio el nombre de la carpeta?**
R: No pasa nada, IndexedDB está asociado al navegador, no a la ruta.

**P: ¿Puedo recuperar contraseña si la olvido?**
R: No, está cifrada unidireccionalamente. Pero puedes importar un backup.

**P: ¿Es seguro guardar el backup en OneDrive/Gmail?**
R: El archivo está cifrado, pero contiene el hash. Almacenar en lugar seguro es prudente.

**P: ¿Cada derivación criptográfica es diferente?**
R: No, misma contraseña + mismo salt = mismo hash siempre.
