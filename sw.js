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

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAk0_WA4Zal3m7b_vOC70aPaQeYZqpe_00",
  authDomain: "examenpwa.firebaseapp.com",
  projectId: "examenpwa",
  storageBucket: "examenpwa.firebasestorage.app",
  messagingSenderId: "103530121016",
  appId: "1:103530121016:web:c0eef3027aa38c526063cd"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log("Mensaje recibido en segundo plano:", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
