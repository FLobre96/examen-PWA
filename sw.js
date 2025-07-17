const CACHE_NAME = "caba-encuesta-cache-v2";
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/db.js',
  '/componentes/rating.js',
  '/componentes/listaComentarios.js',
  '/manifest.json',
  '/assets/logo.png',
  '/assets/icono.png',
  '/assets/limpieza.jpg',
  '/assets/transporte.jpg',
  '/assets/espaciosverdes.jpeg',
  '/assets/eventos.jpg',
  '/assets/subte.jpg',
  '/assets/seguridad.jpg',
  '/assets/accesibilidad.jpg'
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
