/* =====================================================
   1. MODO OSCURO
   ===================================================== */

// SELECCIÓN: botón del tema
const btnTema = document.getElementById('btn-tema');

// EVENTO: clic en el botón
btnTema.addEventListener('click', () => {
  // MANIPULACIÓN: alternamos la clase 'dark-mode' en el body
  document.body.classList.toggle('dark-mode');

  // Actualizamos ícono y estado accesible
  const oscuro = document.body.classList.contains('dark-mode');
  btnTema.textContent = oscuro ? '☀️' : '🌙';
  btnTema.setAttribute('aria-pressed', String(oscuro));
});


/* =====================================================
   2. MENÚS HAMBURGUESA POR SECCIÓN (independientes)
   ===================================================== */

// SELECCIÓN: todos los botones ☰ de sección
const botonesSeccion = document.querySelectorAll('.btn-seccion');

botonesSeccion.forEach((boton) => {
  // EVENTO: clic en cada botón
  boton.addEventListener('click', () => {
    // SELECCIÓN: la sección que contiene a este botón
    const seccion = boton.closest('.seccion');

    // MANIPULACIÓN: alternamos la clase solo en esa sección
    seccion.classList.toggle('section-collapsed');

    // Actualizamos el estado accesible del botón
    const colapsada = seccion.classList.contains('section-collapsed');
    boton.setAttribute('aria-expanded', String(!colapsada));
  });
});


/* =====================================================
   3. FILTRO DE MÚSICA (DOBLE SELECCIÓN: género → artista)
   ===================================================== */

// SELECCIÓN: botones de género, contenedor de artistas y tarjetas
const botonesGenero = document.querySelectorAll('.filtro-genero');
const contenedorArtistas = document.getElementById('filtros-artistas');
const canciones = document.querySelectorAll('.cancion');

// Estado actual de los dos filtros
let generoActual = 'todos';
let artistaActual = 'todos';

// Convierte "ed-sheeran" en "Ed Sheeran"
function formatearArtista(slug) {
  return slug
    .split('-')
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

// MANIPULACIÓN: muestra solo las canciones que coinciden con género Y artista
function aplicarFiltrosMusica() {
  canciones.forEach((cancion) => {
    const coincideGenero = generoActual === 'todos' || cancion.dataset.genero === generoActual;
    const coincideArtista = artistaActual === 'todos' || cancion.dataset.artista === artistaActual;

    cancion.style.display = coincideGenero && coincideArtista ? 'block' : 'none';
  });
}

// Crea un botón secundario de artista
function crearBotonArtista(valor, texto) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'filtro filtro-artista' + (valor === artistaActual ? ' active' : '');
  boton.dataset.artista = valor;
  boton.textContent = texto;

  // EVENTO: clic en un artista
  boton.addEventListener('click', () => {
    artistaActual = valor;
    contenedorArtistas.querySelectorAll('.filtro-artista').forEach((b) => b.classList.remove('active'));
    boton.classList.add('active');
    aplicarFiltrosMusica();
  });

  return boton;
}

// Genera dinámicamente los botones de artistas del género elegido
function mostrarArtistas(genero) {
  contenedorArtistas.innerHTML = '';

  // Si el género es "Todos", ocultamos los botones secundarios
  if (genero === 'todos') {
    contenedorArtistas.hidden = true;
    return;
  }

  // Recogemos los artistas únicos de ese género (leyendo data-artista)
  const artistas = [];
  canciones.forEach((cancion) => {
    const artista = cancion.dataset.artista;
    if (cancion.dataset.genero === genero && !artistas.includes(artista)) {
      artistas.push(artista);
    }
  });

  contenedorArtistas.appendChild(crearBotonArtista('todos', 'Todos los artistas'));
  artistas.forEach((artista) => {
    contenedorArtistas.appendChild(crearBotonArtista(artista, formatearArtista(artista)));
  });
  contenedorArtistas.hidden = false;
}

// EVENTO: clic en un botón de género
botonesGenero.forEach((boton) => {
  boton.addEventListener('click', () => {
    generoActual = boton.dataset.filtro;
    artistaActual = 'todos'; // al cambiar de género se reinicia el artista

    botonesGenero.forEach((b) => b.classList.remove('active'));
    boton.classList.add('active');

    mostrarArtistas(generoActual);
    aplicarFiltrosMusica();
  });
});


/* =====================================================
   4. FILTRO DE JUEGOS (data-categoria)
   ===================================================== */

// SELECCIÓN: botones de filtro y filas de la tabla
const botonesJuegos = document.querySelectorAll('.filtro-juego');
const filasJuegos = document.querySelectorAll('#tabla-juegos tbody tr');

botonesJuegos.forEach((boton) => {
  // EVENTO: clic en un botón de filtro
  boton.addEventListener('click', () => {
    const filtro = boton.dataset.filtro;

    // Marcamos el botón activo
    botonesJuegos.forEach((b) => b.classList.remove('active'));
    boton.classList.add('active');

    // MANIPULACIÓN: comparamos dataset.categoria y mostramos/ocultamos.
    // Para filas usamos 'table-row' (con 'block' se desalinean las columnas).
    filasJuegos.forEach((fila) => {
      if (filtro === 'todos' || fila.dataset.categoria === filtro) {
        fila.style.display = 'table-row';
      } else {
        fila.style.display = 'none';
      }
    });
  });
});


/* =====================================================
   5. VALIDACIÓN DEL FORMULARIO (EN TIEMPO REAL)
   ===================================================== */

// SELECCIÓN: formulario y campos
const form = document.getElementById('form-contacto');
const inputNombre = document.getElementById('nombre');
const inputEmail = document.getElementById('email');
const inputMensaje = document.getElementById('mensaje');

// Contenedor del mensaje de éxito: si no existe en el HTML, lo creamos
let alertas = document.getElementById('resultado-form');
if (!alertas) {
  alertas = document.createElement('div');
  alertas.id = 'resultado-form';
  alertas.setAttribute('aria-live', 'polite');
  form.insertAdjacentElement('afterend', alertas);
}

// Devuelve el div de error de un campo; si el HTML no lo tiene, lo crea debajo del input
function obtenerContenedorError(input) {
  let div = document.getElementById('error-' + input.id);
  if (!div) {
    div = document.createElement('div');
    div.id = 'error-' + input.id;
    div.className = 'msg-campo';
    div.setAttribute('aria-live', 'polite');
    input.insertAdjacentElement('afterend', div);
  }
  return div;
}

// Expresiones regulares estrictas
const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Mensajes de error
const MSG_NOMBRE = '❌ El nombre solo debe contener letras, no números ni símbolos.';
const MSG_NOMBRE_VACIO = '❌ Escribe tu nombre.';
const MSG_EMAIL = '❌ Ingresa un correo electrónico válido (ejemplo@dominio.com).';
const MSG_MENSAJE = '❌ El mensaje no puede estar vacío.';

/* ---------- Validadores ----------
   Cada uno devuelve un texto de error, o '' si no hay error.
   "Vivo" = se ejecuta mientras el usuario escribe.
   "Final" = se ejecuta al enviar (exige el campo completo y correcto). */

// NOMBRE: cualquier número o símbolo dispara el error al instante
function nombreVivo(valor) {
  if (valor === '') return '';
  return regexNombre.test(valor) ? '' : MSG_NOMBRE;
}
function nombreFinal(valor) {
  if (valor.trim() === '') return MSG_NOMBRE_VACIO;
  return regexNombre.test(valor) ? '' : MSG_NOMBRE;
}

// EMAIL: detecta caracteres que no van mientras se escribe
function emailVivo(valor) {
  if (valor === '') return '';

  // Solo se permiten letras, números y . _ % + - @  (los espacios se rechazan)
  if (/[^a-zA-Z0-9._%+@-]/.test(valor)) return MSG_EMAIL;

  // Solo puede haber un @
  if ((valor.match(/@/g) || []).length > 1) return MSG_EMAIL;

  // Si ya escribió el @, revisamos el dominio
  if (valor.includes('@')) {
    const dominio = valor.split('@')[1];

    // El dominio solo admite letras, números, punto y guion
    if (!/^[a-zA-Z0-9.-]*$/.test(dominio)) return MSG_EMAIL;

    // Después del último punto (.com, .org) solo van letras
    if (dominio.includes('.')) {
      const extension = dominio.split('.').pop();
      if (!/^[a-zA-Z]*$/.test(extension)) return MSG_EMAIL;
    }
  }
  return '';
}
function emailFinal(valor) {
  return regexEmail.test(valor) ? '' : MSG_EMAIL;
}

// MENSAJE: no puede quedar vacío
function mensajeValidar(valor) {
  return valor.trim() === '' ? MSG_MENSAJE : '';
}

// Lista de campos: input, div de error y validadores
const campos = [
  { input: inputNombre, error: obtenerContenedorError(inputNombre), vivo: nombreVivo, final: nombreFinal },
  { input: inputEmail, error: obtenerContenedorError(inputEmail), vivo: emailVivo, final: emailFinal },
  { input: inputMensaje, error: obtenerContenedorError(inputMensaje), vivo: mensajeValidar, final: mensajeValidar }
];

// MANIPULACIÓN: muestra u oculta el error de un campo con innerHTML
function mostrarError(campo, texto) {
  if (texto) {
    campo.error.style.display = 'block';
    campo.error.innerHTML = '<span class="msg-error">' + texto + '</span>';
    campo.input.setAttribute('aria-invalid', 'true');
  } else {
    campo.error.innerHTML = '';
    campo.input.removeAttribute('aria-invalid');
  }
}

// EVENTO (tiempo real): se ejecuta con CADA carácter escrito o borrado
campos.forEach((campo) => {
  campo.input.addEventListener('input', () => {
    alertas.innerHTML = ''; // quitamos el mensaje de éxito anterior
    mostrarError(campo, campo.vivo(campo.input.value));
  });
});

// EVENTO: envío del formulario
form.addEventListener('submit', (e) => {
  // Evitamos la recarga de la página
  e.preventDefault();

  let primerCampoInvalido = null;

  // Validación final de todos los campos
  campos.forEach((campo) => {
    const texto = campo.final(campo.input.value);
    mostrarError(campo, texto);
    if (texto && !primerCampoInvalido) primerCampoInvalido = campo;
  });

  // Si hay error: nos detenemos (return) y NO limpiamos el formulario
  if (primerCampoInvalido) {
    alertas.innerHTML = '';
    primerCampoInvalido.input.focus();
    return;
  }

  // Todo correcto: mensaje verde y limpieza del formulario
  alertas.style.display = 'block';
  alertas.innerHTML = '<div class="msg-exito">✅ ¡Mensaje enviado correctamente! Gracias por escribirme.</div>';
  form.reset();
});


/* =====================================================
   6. IMAGEN DE RESPALDO (si una foto no carga)
   ===================================================== */

// SELECCIÓN: todas las imágenes de las tarjetas
const imagenesTarjeta = document.querySelectorAll('.tarjeta-media img');

// MANIPULACIÓN: cambia la imagen por una de respaldo (una sola vez)
function usarRespaldo(img, indice) {
  if (img.dataset.respaldo) return;
  img.dataset.respaldo = 'true';
  img.src = 'https://picsum.photos/seed/portafolio' + indice + '/400/300';
}

imagenesTarjeta.forEach((img, indice) => {
  // EVENTO: la imagen falló al cargar
  img.addEventListener('error', () => usarRespaldo(img, indice));

  // Por si ya había fallado antes de que se ejecutara el script
  if (img.complete && img.naturalWidth === 0) usarRespaldo(img, indice);
});