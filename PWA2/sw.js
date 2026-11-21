// Nicolás – Service Worker
// Si cambias archivos de la app, sube el número de versión para renovar la caché.
const CACHE = 'nicolas-v2';
const JQUERY = 'https://code.jquery.com/jquery-3.7.1.min.js';
const PRECACHE = ['./', './index.html', './app.js', './manifest.json', './icon-192.png', './icon-512.png', JQUERY];

self.addEventListener('install', (e) => {
  e.waitUntil(
    // Archivo por archivo: si alguno falta, el service worker igual se instala
    caches.open(CACHE)
      .then((c) => Promise.allSettled(PRECACHE.map((f) => c.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// app.js le pasa las rutas de tus fotos y fondos reales para guardarlas sin internet
self.addEventListener('message', (e) => {
  if (e.data && e.data.tipo === 'cachear' && Array.isArray(e.data.urls)) {
    e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(e.data.urls.map((u) => c.add(u)))));
  }
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && req.url !== JQUERY) return;   // YouTube y redes no se guardan

  // Páginas: primero la red (siempre la versión nueva); sin internet, la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Archivos de la app: desde la caché y se actualizan en segundo plano
  e.respondWith(
    caches.match(req).then((cached) => {
      const red = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || red;
    })
  );
});