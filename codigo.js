// Visualiza la diferencia entre hora-final y hora-inicio automáticamente
function actualizarDiferenciaHoras() {
  const inicio = document.getElementById('hora-inicio').value;
  const final = document.getElementById('hora-final').value;
  const span = document.getElementById('diferencia-horas');
  if (!inicio || !final) {
    span.textContent = '';
    return;
  }
  // Permite HH:MM o HH:MM:SS
  const inicioArr = inicio.split(':').map(Number);
  const finalArr = final.split(':').map(Number);
  if (inicioArr.length < 2 || finalArr.length < 2 || inicioArr.some(isNaN) || finalArr.some(isNaN)) {
    span.textContent = 'Formato inválido';
    return;
  }
  // Si no hay segundos, se asume 0
  const [h1, m1, s1 = 0] = inicioArr;
  const [h2, m2, s2 = 0] = finalArr;
  // Convierte todo a segundos
  let segundosInicio = h1 * 3600 + m1 * 60 + s1;
  let segundosFinal = h2 * 3600 + m2 * 60 + s2;
  let diferencia = segundosFinal - segundosInicio;
  if (diferencia < 0) {
    diferencia += 24 * 3600; // Si cruza medianoche
  }
  const horas = Math.floor(diferencia / 3600);
  const minutos = Math.floor((diferencia % 3600) / 60);
  const segundos = diferencia % 60;
  // Formato hh:mm:ss con ceros a la izquierda
  const hh = String(horas).padStart(2, '0');
  const mm = String(minutos).padStart(2, '0');
  const ss = String(segundos).padStart(2, '0');
  span.textContent = `Diferencia: ${hh}:${mm}:${ss}`;
}

document.getElementById('hora-inicio').addEventListener('input', actualizarDiferenciaHoras);
document.getElementById('hora-final').addEventListener('input', actualizarDiferenciaHoras);
document.getElementById('inicio').addEventListener('change', actualizarDiferenciaHoras);
document.getElementById('final').addEventListener('change', actualizarDiferenciaHoras);
let registros = [];

setInterval(() => {
  localStorage.setItem("registros", JSON.stringify(registros));
}, 300000); // Guarda cada 5 minutos

function guardarFormulario() {
  const campos = [
    "hora-inicio", "inicio", "hora-final", "final", "nombre", "acciones", "detalle",
    "tiempo", "actualizado", "documentos", "categoria", "analista", "documento",
    "asignado", "prioridad", "fecha"
  ];

  // Validar que todos los campos requeridos estén llenos
  let faltantes = [];
  campos.forEach(id => {
    const el = document.getElementById(id);
    let valor = "";
    if (!el) return faltantes.push(id);
    if (el.tagName === "SELECT") {
      valor = el.options[el.selectedIndex]?.value || "";
    } else {
      valor = el.value || "";
    }
    if (!valor) faltantes.push(id);
  });

  if (faltantes.length > 0) {
    alert("Debes rellenar todos los datos obligatorios antes de guardar.");
    return;
  }

  // Si todo está bien, guardar
  const registro = campos.map(id => {
    const el = document.getElementById(id);
    if (!el) return "";
    if (el.tagName === "SELECT") {
      return el.options[el.selectedIndex]?.text || "";
    }
    return el.value || "";
  });

  registros.push(registro);
  localStorage.setItem("registros", JSON.stringify(registros));

  document.getElementById("contador-formularios").textContent =
    `🗂️ ${registros.length} Registro${registros.length === 1 ? "" : "s"}`;

  borrarDatos();
  // Autocompletar valores por defecto después de guardar
  document.getElementById("tiempo").value = "En Línea (1 - 10 minutos)";
  document.getElementById("actualizado").value = "Nuevo";
  document.getElementById("prioridad").value = "Medium";
  var hoy = new Date();
  var yyyy = hoy.getFullYear();
  var mm = String(hoy.getMonth() + 1).padStart(2, '0');
  var dd = String(hoy.getDate()).padStart(2, '0');
  document.getElementById("fecha").value = yyyy + '-' + mm + '-' + dd;
  alert("Formulario guardado. Puedes llenar otro.");
}

function descargarTodoCSV() {
  if (registros.length === 0) {
    alert("No hay formularios guardados.");
    return;
  }

  const encabezados = [
    "Inicio", "Estado de Inicio", "Final", "Estado Final", "Nombre", "Acciones",
    "Detalle de Solicitud", "Fallas", "Descripción", "Comentarios", "Tiempo de Gestión",
    "Nuevo o Actualizado", "Cant Documentos", "Categoría", "Analista/Área",
    "Nombre de Documento", "Asignado a", "Prioridad", "Fecha de Entrega"
  ];

  let contenido = encabezados.join(",") + "\n";
  registros.forEach(fila => {
    contenido += fila.map(valor => `"${valor}"`).join(",") + "\n";
  });

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "SUIC Data.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function colocarHora(tipo) {
  const horaActual = new Date().toLocaleTimeString('es-PE', { hour12: false });
  const valor = document.getElementById(tipo).value;

  if (tipo === 'inicio' && valor === 'En proceso') {
    document.getElementById('hora-inicio').value = horaActual;
  }

  if (tipo === 'final' && ['En pausa', 'Reasignado', 'Finalizado'].includes(valor)) {
    document.getElementById('hora-final').value = horaActual;
  }
}

function descargarDatos() {
  const campos = [
    { id: "hora-inicio" }, { id: "inicio" }, { id: "hora-final" }, { id: "final" },
    { id: "nombre" }, { id: "acciones" }, { id: "detalle" }, { id: "fallas" },
    { id: "descripcion" }, { id: "comentarios" }, { id: "tiempo" }, { id: "actualizado" },
    { id: "documentos" }, { id: "categoria" }, { id: "analista" }, { id: "documento" },
    { id: "asignado" }, { id: "prioridad" }, { id: "fecha" }
  ];

  const encabezados = campos.map(c => `"${document.querySelector(`label[for="${c.id}"]`)?.innerText || c.id}"`).join(",");
  const valores = campos.map(c => {
    const el = document.getElementById(c.id);
    if (!el) return '""';
    if (el.tagName === "SELECT") {
      return `"${el.options[el.selectedIndex]?.text || ""}"`;
    }
    return `"${el.value || ""}"`;
  }).join(",");

  const contenidoCSV = `${encabezados}\n${valores}`;
  const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "SUIC Data.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function borrarDatos() {
  const elementos = document.querySelectorAll('input, textarea, select');
  elementos.forEach(el => {
    if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else if (['text', 'number', 'date'].includes(el.type) || el.tagName === 'TEXTAREA') {
      el.value = '';
    }
  });
}

window.addEventListener("load", () => {
  const dataGuardada = localStorage.getItem("registros");
  if (dataGuardada) {
    registros = JSON.parse(dataGuardada);
    document.getElementById("contador-formularios").textContent =
      `🗂️ ${registros.length} Registro${registros.length === 1 ? "" : "s"}`;
  }
});

function borrarHistorial() {
  if (confirm("¿Estás seguro de borrar todos los formularios guardados? Esta acción no se puede deshacer.")) {
    registros = [];
    localStorage.removeItem("registros");
    document.getElementById("contador-formularios").textContent = "🗂️ 0 Registros";
    alert("Historial eliminado con éxito.");
  }
}

const opcionesPorCategoria = {
    "Accesos al Portal": ["Asignar rol y organización"],
    "Banner": ["Actualizar", "Desactivar", "Diseñar", "Publicar"],
    "Base Usuarios": ["Asignar rol y organización", "Desactivar, eliminar usuarios"],
    "Bases": ["Actualizar", "Desactivar", "Publicar"],
    "Boletín": ["Actualizar", "Diseñar y publicar"],
    "Competencias": ["Agregar Candidatos", "Ampliación de Proceso", "Atención Fallas", "Cambio de Correo", "Creación de Proceso", "Envío Recordatorio", "Reportes"],
    "Consolidado de Precios": ["Actualizar listas", "Implementación Nuevas Opciones", "Stock Diario (11092023)"],
    "Diagrama Postventa": ["Actualizar", "Propuesta", "Publicar"],
    "Diagrama Venta (Resumen NP)": ["Actualizar", "Creación de Diagrama", "Desactivar", "Publicar"],
    "Documento": ["Actualizar", "Dar formato SUIC", "Desactivar"],
    "Ficha": ["Actualizar Ficha", "Actualizar Registro del Caso", "Creación Ficha", "Creación Registro del Caso", "Desactivar Ficha", "Desactivar Registro del Caso", "Publicar Ficha", "Publicar Registro del Caso"],
    "Hojas de Venta": ["Desactivar", "Publicar"],
    "INFO ATC": ["Crear Info ATC", "Desactivar", "Publicar"],
    "Otros": ["Capacitación", "Reunión", "Revisión de fallas", "Tiempo Fallas en el Portal", "Trabajos TI en MDY"],
    "Pop up": ["Diseñar y publicar", "Programar Alerta"],
    "Proyecto": ["Propuesta de Mejora", "Proyectos C&C"],
    "Publicaciones": ["Publicar"],
  // Puedes agregar más pares categoría ↔ opciones aquí
};

document.getElementById("categoria").addEventListener("change", function () {
  const valorCategoria = this.value.trim();
  const detalleLista = document.getElementById("detalles");

  detalleLista.innerHTML = "";

  const nuevasOpciones = opcionesPorCategoria[valorCategoria];

  if (nuevasOpciones) {
    nuevasOpciones.forEach(opcionTexto => {
      const opcion = document.createElement("option");
      opcion.value = opcionTexto;
      detalleLista.appendChild(opcion);
    });
  } else {
    const opcionesGenerales = [
      "Actualizar", "Agregar Candidatos", "Capacitación", "Creación de Proceso",
      "Desactivar", "Publicar Registro del Caso", "Reunión", "Tiempo Fallas en el Portal"
    ];

    opcionesGenerales.forEach(opcionTexto => {
      const opcion = document.createElement("option");
      opcion.value = opcionTexto;
      detalleLista.appendChild(opcion);
    });
  }
});





