/* ==========================================================
   Nicolás – Portafolio PWA | app.js
   Todos los eventos usan .off().on() con espacio de nombres (.nic)
   para no acumular manejadores duplicados (memory leaks).
   Los textos del usuario se insertan con .text()/.val(), nunca con .html() (anti-XSS).
   ========================================================== */

/* ==========================================================
   Nicolás – Portafolio PWA | app.js
   AQUÍ NO TIENES QUE CAMBIAR NADA: tus imágenes, tu correo y tus redes se escriben en index.html
   (busca el comentario "★ DÓNDE PONER TUS IMÁGENES Y DATOS ★" al inicio del <body>).
   ========================================================== */

/* ---------- SERVICE WORKER (PWA) ---------- */
function rutasPropias() {                       // imágenes locales escritas en el HTML, para guardarlas y verlas sin internet
  var r = [];
  document.querySelectorAll('img[src], [data-dia], [data-noche]').forEach(function (el) {
    ['src', 'data-dia', 'data-noche'].forEach(function (a) {
      var v = (el.getAttribute(a) || '').trim();
      if (v && !/^(https?:|data:|\/\/)/i.test(v) && r.indexOf(v) < 0) { r.push(v); }
    });
  });
  return r;
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js')
      .then(function (reg) { console.log('Service Worker registrado:', reg.scope); })
      .catch(function (err) { console.error('Fallo en el registro del SW:', err); });
    navigator.serviceWorker.ready.then(function (reg) {
      var rutas = rutasPropias();
      if (rutas.length && reg.active) { reg.active.postMessage({ tipo: 'cachear', urls: rutas }); }
    });
  });
}

$(function () {
  'use strict';
  var NS = '.nic';

  /* ---------- UTILIDADES ---------- */
  var toastTimer = null;
  function toast(msg, esError) {
    var $t = $('#toast');
    $t.text(msg).toggleClass('error', !!esError).addClass('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $t.removeClass('show'); }, 3500);
  }
  function on(evento, selector, fn) { $(document).off(evento + NS, selector).on(evento + NS, selector, fn); }

  /* ---------- 1. CARRUSEL DE FONDO ---------- */
  var slides = $('.bg-slide'), actual = 0;
  setInterval(function () {
    if (document.hidden) { return; }
    slides.removeClass('active');
    actual = (actual + 1) % slides.length;
    slides.eq(actual).addClass('active');
  }, 6000);

  /* ---------- 2. MODO OSCURO (paisajes de día ⇄ noche) ---------- */
  function aplicarTema(oscuro) {
    $('body').toggleClass('dark-mode', oscuro);
    $('#themeBtn').text(oscuro ? '☀️' : '🌙').attr({ 'aria-pressed': oscuro, 'aria-label': oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro' });
    $('meta[name="theme-color"]').attr('content', oscuro ? '#0f172a' : '#f97316');
  }
  try { aplicarTema(localStorage.getItem('nic-tema') === 'oscuro'); } catch (e) { aplicarTema(false); }
  on('click', '#themeBtn', function () {
    var oscuro = !$('body').hasClass('dark-mode');
    aplicarTema(oscuro);
    try { localStorage.setItem('nic-tema', oscuro ? 'oscuro' : 'claro'); } catch (e) { /* sin almacenamiento */ }
  });

  /* ---------- 3. MODALES + MENÚ ---------- */
  var ultimoFoco = null;
  function abrirModal(id) {
    var $m = $('#' + id);
    if (!$m.length) { return; }
    ultimoFoco = document.activeElement;
    $('#sidebar').removeClass('active'); $('#menuToggle').attr('aria-expanded', 'false');
    $m.addClass('active');
    if (id !== 'modal-visor') { $('footer .nav-item').removeClass('active').filter('[data-open="' + id + '"]').addClass('active'); }
    setTimeout(function () { $m.find('.modal-close').first().trigger('focus'); }, 50);
    if (id === 'modal-fotos') { renderFotos(); }
  }
  function cerrarModal($overlay) {
    $overlay.removeClass('active');
    if (!$('.modal-overlay.active').length) {
      $('footer .nav-item').removeClass('active');
      if (ultimoFoco && ultimoFoco.focus) { ultimoFoco.focus(); }
    }
  }
  on('click', '[data-open]', function () { abrirModal($(this).data('open')); });
  on('click', '.modal-close', function () { cerrarModal($(this).closest('.modal-overlay')); });
  on('click', '.modal-overlay', function (e) { if (e.target === this) { cerrarModal($(this)); } });
  $(document).off('keydown' + NS).on('keydown' + NS, function (e) {
    if (e.key === 'Escape') {
      var $arriba = $('.modal-overlay.active').last();
      if ($arriba.length) { cerrarModal($arriba); } else { $('#sidebar').removeClass('active'); $('#menuToggle').attr('aria-expanded', 'false'); }
    }
  });

  on('click', '#menuToggle', function (e) {
    e.stopPropagation();
    var abierto = $('#sidebar').toggleClass('active').hasClass('active');
    $(this).attr('aria-expanded', abierto);
  });
  on('click', 'body', function (e) {
    if (!$(e.target).closest('#sidebar, #menuToggle').length) { $('#sidebar').removeClass('active'); $('#menuToggle').attr('aria-expanded', 'false'); }
  });

  /* ---------- 4. FILTROS (videojuegos y música) ---------- */
  on('click', '.btn-filter', function () {
    var $b = $(this), filtro = $b.data('filter');
    $b.siblings().removeClass('active').attr('aria-pressed', 'false');
    $b.addClass('active').attr('aria-pressed', 'true');
    $b.closest('.modal').find('.media-card').each(function () {
      $(this).toggle(filtro === 'todos' || $(this).data('category') === filtro);
    });
  });

  /* ---------- 6. ESTADO DE RED ---------- */
  var estabaOffline = false;
  function actualizarRed() {
    var online = navigator.onLine;
    $('#estadoRed').toggleClass('offline', !online);
    $('#estadoRed .net-icon').text(online ? '🌐' : '⚠️');
    $('#estadoRed .net-text').text(online ? 'En línea' : 'Sin conexión');
    $('body').toggleClass('offline', !online);
    $('#musicaOffline').toggle(!online);
    if (!online) { toast('Sin conexión: la app sigue funcionando.'); estabaOffline = true; }
    else if (estabaOffline) { toast('Conexión restablecida.'); estabaOffline = false; }
  }
  $(window).off('online' + NS + ' offline' + NS).on('online' + NS + ' offline' + NS, actualizarRed);
  actualizarRed();
  on('click', '.btn-listen', function (e) {
    if (!navigator.onLine) { e.preventDefault(); toast('Necesitas internet para escuchar la canción.', true); }
  });

  /* ---------- 7. IMÁGENES (las rutas se escriben en index.html) ---------- */
  function idYoutube(v) {                                          // acepta el enlace completo o solo el código de 11 letras
    v = (v || '').trim();
    var m = v.match(/(?:[?&]v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/) || v.match(/^([\w-]{11})$/);
    return m ? m[1] : '';
  }
  function marcador($img) {                                        // recuadro vacío mientras no haya imagen
    var $ph = $('<div>').addClass('thumb-ph').attr({ role: 'img', 'aria-label': $img.attr('alt') || 'Imagen' })
      .html('<svg class="ic" aria-hidden="true"><use href="#i-images"/></svg>');
    $img.replaceWith($ph);
  }
  $('img.thumb-img').each(function () {
    var $i = $(this), src = ($i.attr('src') || '').trim(), $card = $i.closest('.media-card'), vid = idYoutube($card.attr('data-video'));
    if (vid) {                                                     // canción con enlace: botón al video exacto y su miniatura
      $card.find('.btn-listen').attr('href', 'https://www.youtube.com/watch?v=' + vid);
      if (!src) { src = 'https://img.youtube.com/vi/' + vid + '/mqdefault.jpg'; }
    }
    if (!src && $i.hasClass('only-night')) { src = ($i.siblings('img.only-day').attr('src') || '').trim(); }     // sin foto de noche: se usa la de día
    if (!src && $i.hasClass('only-day')) { src = ($i.siblings('img.only-night').attr('src') || '').trim(); }
    if (!src) { if ($i.hasClass('only-night')) { $i.remove(); } else { marcador($i); } return; }
    $i.attr('src', src);
  });
  document.addEventListener('error', function (e) {                // si una ruta está mal escrita, se muestra el recuadro vacío
    var t = e.target;
    if (t && t.tagName === 'IMG' && $(t).hasClass('thumb-img')) { if ($(t).hasClass('only-night')) { $(t).remove(); } else { marcador($(t)); } }
  }, true);
  $('.bg-slide').each(function (i) {                               // fondos de día y de noche (data-dia / data-noche)
    var d = ($(this).attr('data-dia') || '').trim(), n = ($(this).attr('data-noche') || '').trim();
    if (d) { document.documentElement.style.setProperty('--bg' + (i + 1) + '-dia', 'url("' + d + '")'); }
    if (n) { document.documentElement.style.setProperty('--bg' + (i + 1) + '-noche', 'url("' + n + '")'); }
  });

  /* ==========================================================
     8. FORMULARIO DE CONTACTO CON VALIDACIONES
     ========================================================== */
  var reNombreFiltro = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'\-]/g;
  var reNombre = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[\s'\-]+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
  var reCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var reCelular = /^[67]\d{6,7}$/;       // celulares de Bolivia: 7 u 8 dígitos que empiezan con 6 o 7

  function setError($el, msg) {
    $el.toggleClass('invalid', !!msg).attr('aria-invalid', !!msg);
    $el.closest('.field').find('.error-msg').first().text(msg || '');
    return !msg;
  }
  function vNombre() {
    var v = $('#cNombre').val().trim();
    if (!v) { return setError($('#cNombre'), 'Escribe tu nombre.'); }
    if (v.length < 3) { return setError($('#cNombre'), 'El nombre es demasiado corto.'); }
    if (!reNombre.test(v)) { return setError($('#cNombre'), 'Solo letras y espacios.'); }
    return setError($('#cNombre'), '');
  }
  function vCorreo() {
    var v = $('#cCorreo').val().trim();
    if (!v) { return setError($('#cCorreo'), 'Escribe tu correo.'); }
    if (!reCorreo.test(v)) { return setError($('#cCorreo'), 'Ingresa un correo válido (ej. nombre@correo.com).'); }
    return setError($('#cCorreo'), '');
  }
  function vCelular() {
    var v = $('#cCelular').val();
    if (!v) { return setError($('#cCelular'), ''); }               // es opcional
    if (!reCelular.test(v)) { return setError($('#cCelular'), 'Ingresa 7 u 8 dígitos que empiecen con 6 o 7.'); }
    return setError($('#cCelular'), '');
  }
  function vAsunto() {
    if (!$('#cAsunto').val()) { return setError($('#cAsunto'), 'Selecciona un asunto.'); }
    return setError($('#cAsunto'), '');
  }
  function vMensaje() {
    var v = $('#cMensaje').val().trim();
    if (!v) { return setError($('#cMensaje'), 'Escribe tu mensaje.'); }
    if (v.length < 10) { return setError($('#cMensaje'), 'Escribe al menos 10 caracteres.'); }
    return setError($('#cMensaje'), '');
  }
  function vAcepto() {
    if (!$('#cAcepto').is(':checked')) { return setError($('#cAcepto'), 'Debes aceptar para poder enviar.'); }
    return setError($('#cAcepto'), '');
  }

  on('input', '#cNombre', function () {
    var limpio = this.value.replace(reNombreFiltro, '');
    if (limpio !== this.value) { this.value = limpio; setError($(this), 'Solo letras y espacios.'); } else { setError($(this), ''); }
  });
  on('input', '#cCelular', function () {
    var limpio = this.value.replace(/\D/g, '');
    if (limpio !== this.value) { this.value = limpio; setError($(this), 'Solo números.'); } else { setError($(this), ''); }
  });
  on('input', '#cMensaje', function () { $('#cContador').text(this.value.length + ' / 500'); setError($(this), ''); });
  on('input', '#cCorreo', function () { setError($(this), ''); });
  on('blur', '#cNombre', vNombre);
  on('blur', '#cCorreo', vCorreo);
  on('blur', '#cCelular', vCelular);
  on('change', '#cAsunto', vAsunto);
  on('blur', '#cMensaje', vMensaje);
  on('change', '#cAcepto', vAcepto);

  function correoDestino() { var c = ($('#formContacto').attr('data-email') || '').trim(); return reCorreo.test(c) ? c : ''; }
  var ultimoEnvio = 0;
  on('submit', '#formContacto', function (e) {
    e.preventDefault();
    if ($('#cWeb').val()) { return; }                              // trampa anti-bots (campo oculto)
    var ok = [vNombre(), vCorreo(), vCelular(), vAsunto(), vMensaje(), vAcepto()].every(Boolean);
    if (!ok) { toast('Revisa los campos marcados.', true); $('#formContacto .invalid').first().trigger('focus'); return; }
    if (Date.now() - ultimoEnvio < 5000) { toast('Espera unos segundos antes de enviar otro mensaje.', true); return; }
    ultimoEnvio = Date.now();

    var datos = {
      nombre: $('#cNombre').val().trim(), correo: $('#cCorreo').val().trim(), celular: $('#cCelular').val(),
      asunto: $('#cAsunto').val(), mensaje: $('#cMensaje').val().trim(), fecha: new Date().toISOString()
    };
    // Copia local de los mensajes enviados (se conserva sin internet)
    try {
      var guardados = JSON.parse(localStorage.getItem('nic-mensajes') || '[]');
      guardados.push(datos);
      localStorage.setItem('nic-mensajes', JSON.stringify(guardados.slice(-20)));
    } catch (err) { /* sin almacenamiento */ }

    var correo = correoDestino();
    if (correo) {
      var cuerpo = 'Nombre: ' + datos.nombre + '\nCorreo: ' + datos.correo + (datos.celular ? '\nCelular: ' + datos.celular : '') + '\n\n' + datos.mensaje;
      window.location.href = 'mailto:' + correo + '?subject=' + encodeURIComponent('[Portafolio] ' + datos.asunto) + '&body=' + encodeURIComponent(cuerpo);
    }
    toast('✅ ¡Mensaje listo! Gracias por escribirme, ' + datos.nombre.split(' ')[0] + '.');
    this.reset();
    $('#cContador').text('0 / 500');
    $('#formContacto .invalid').removeClass('invalid').removeAttr('aria-invalid');
    $('#formContacto .error-msg').text('');
    cerrarModal($('#modal-contacto'));
  });

  /* ==========================================================
     9. FOTOS Y VISOR: toca cualquier imagen para verla completa
     ========================================================== */
  var visorLista = [], visorIdx = -1;
  function renderFotos() {                                         // las fotos se escriben en el HTML; aquí solo se cuenta
    var n = $('#gridFotos .photo').length;
    $('#fotosContador').text(n ? n + (n === 1 ? ' foto' : ' fotos') : '');
  }
  function mostrarVisor(i) {
    visorIdx = (i + visorLista.length) % visorLista.length;
    var it = visorLista[visorIdx];
    $('#visorImg').attr({ src: it.src, alt: it.alt });
    $('#visorTitulo').text(it.titulo);
    $('#visorContador').text((visorIdx + 1) + ' / ' + visorLista.length);
    $('#visorPrev, #visorNext').prop('disabled', visorLista.length < 2);
  }
  on('click', 'img.zoomable', function () {
    var $img = $(this), $imgs = $img.closest('.modal').find('img.zoomable:visible');
    if (!$imgs.length) { $imgs = $img; }
    visorLista = $imgs.map(function () {
      var $i = $(this), t = $i.closest('.media-card').find('.media-title').first().text() || $i.attr('alt') || 'Imagen';
      return { src: $i.attr('src'), alt: $i.attr('alt') || t, titulo: t };
    }).get();
    abrirModal('modal-visor');
    mostrarVisor($imgs.index($img));
  });
  on('click', '#visorPrev', function () { mostrarVisor(visorIdx - 1); });
  on('click', '#visorNext', function () { mostrarVisor(visorIdx + 1); });
  $(document).off('keydown.visor').on('keydown.visor', function (e) {
    if (!$('#modal-visor').hasClass('active')) { return; }
    if (e.key === 'ArrowLeft') { mostrarVisor(visorIdx - 1); } else if (e.key === 'ArrowRight') { mostrarVisor(visorIdx + 1); }
  });

  renderFotos();
});