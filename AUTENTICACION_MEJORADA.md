# 🔐 Sistema de Autenticación Mejorado

## ¿Qué cambió?

Tu contraseña ahora usa **IndexedDB** en lugar de localStorage. Esto significa que:

✅ **Funciona entre navegadores diferentes** (Chrome, Firefox, Edge, etc.)
✅ **Funciona incluso si cambias la ruta del archivo HTML**
✅ **Tu contraseña persiste una sola vez** - no se te pedirá de nuevo

## Cómo usar

### Primera vez
1. Abre **Opciones.html**
2. Se te pedirá que **crees una contraseña**
3. Confirma la contraseña
4. ¡Listo! Ya tienes acceso

### Siguientes veces
- Solo necesitas **ingresar tu contraseña**
- Funcionará aunque cambies de navegador o de ruta

### ¿Cambié de dispositivo o perdí mi contraseña?

Usamos las funciones de **exportar e importar**:

#### Exportar tu contraseña
1. En la página de Opciones, haz clic en **📥 Exportar**
2. Se descargará un archivo `suic_password_backup_XXXX.json`
3. **Guarda este archivo en un lugar seguro**

#### Importar tu contraseña
1. En el nuevo dispositivo/navegador, abre **Opciones.html**
2. Se te pedirá crear una contraseña
3. Haz clic en **📤 Importar**
4. Selecciona el archivo que exportaste antes
5. ¡Acceso restaurado!

### Cambiar tu contraseña
Si quieres cambiar tu contraseña:
1. Ingresa tu contraseña actual
2. Haz clic en **🔒 Cambiar**
3. Escribe tu nueva contraseña y confirma
4. ¡Hecho!

## 🛡️ Seguridad

- ✅ Tu contraseña se guarda **cifrada con PBKDF2-SHA256**
- ✅ **Nunca se almacena en texto plano**
- ✅ Se usa un salt aleatorio de 16 bytes
- ✅ 150,000 iteraciones para máxima seguridad

## 💡 Recomendaciones

1. **Crea una contraseña fuerte** (combinación de letras, números, símbolos)
2. **Guarda el archivo de export en un lugar seguro** si planeas cambiar dispositivos
3. **No compartas tu archivo de export** - es como compartir tu contraseña
4. Usa una contraseña que **recuerdes fácilmente** para no olvidarla

## Preguntas frecuentes

**P: ¿Qué pasa si pierdo mi contraseña y no tengo el archivo de export?**
R: Lamentablemente, la contraseña se guarda con cifrado unidireccional, así que no se puede recuperar. Tendrías que eliminar el almacenamiento de IndexedDB del navegador (abriendo DevTools > Storage > IndexedDB > SUIC_CONFIG) para empezar de nuevo.

**P: ¿Funciona sin conexión a internet?**
R: Sí, completamente. IndexedDB es local en tu dispositivo.

**P: ¿Puedo usar la misma contraseña en varios dispositivos?**
R: Sí, usa la función de exportar en el dispositivo 1 e importar en el dispositivo 2.

**P: ¿Si cambio el navegador, se me pedirá la contraseña de nuevo?**
R: Depende. Si mantienes la ruta igual y el almacenamiento del navegador intacto, no. Si limpias datos o cambias de navegador, tendrás que importar tu backup.
