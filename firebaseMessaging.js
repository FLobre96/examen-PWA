// firebaseMessaging.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

// Tu configuración de Firebase (reemplazá estos datos con los tuyos)
const firebaseConfig = {
  apiKey: "AIzaSyAk0_WA4Zal3m7b_vOC70aPaQeYZqpe_00",
  authDomain: "examenpwa.firebaseapp.com",
  projectId: "examenpwa",
  storageBucket: "examenpwa.firebasestorage.app",
  messagingSenderId: "103530121016",
  appId: "1:103530121016:web:c0eef3027aa38c526063cd"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Solicita permisos para notificaciones
export function solicitarPermisoNotificaciones() {
  Notification.requestPermission().then((permiso) => {
    if (permiso === 'granted') {
      console.log("Permiso para notificaciones concedido");
      obtenerToken();
    } else {
      console.warn("Permiso para notificaciones denegado");
    }
  });
}

// Obtiene el token del dispositivo
function obtenerToken() {
  getToken(messaging, {
    vapidKey: "BNXs6Wmh8HeBnrqtZjgKdMCCYkv9vXUS2zWGjQU7SYvjqgGTz1zrxhfNmSYbN9kH1Gwn05GoEILAJ6s0DzafHLQ" // VAPID pública configurada en Firebase
  }).then((token) => {
    if (token) {
      console.log("Token de dispositivo:", token);
      // Enviar al servidor si se desea
    } else {
      console.log("No se obtuvo token. Solicitar permisos nuevamente.");
    }
  }).catch((err) => {
    console.error("Error al obtener el token:", err);
  });
}

// Maneja notificaciones cuando la app está abierta
onMessage(messaging, (payload) => {
  console.log("Notificación recibida en primer plano:", payload);
  alert(`Notificación: ${payload.notification.title}\n${payload.notification.body}`);
});
