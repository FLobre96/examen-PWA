import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyAk0_WA4Zal3m7b_vOC70aPaQeYZqpe_00",
  authDomain: "examenpwa.firebaseapp.com",
  projectId: "examenpwa",
  storageBucket: "examenpwa.appspot.com",
  messagingSenderId: "103530121016",
  appId: "1:103530121016:web:c0eef3027aa38c526063cd"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

Notification.requestPermission().then((permission) => {
  if (permission === "granted") {
    getToken(messaging, { vapidKey: 'TU_PUBLIC_VAPID_KEY_AQUI' }).then((currentToken) => {
      if (currentToken) {
        console.log("Token de notificación:", currentToken);
        // Aquí podés enviar el token al servidor o Firestore si hiciera falta
      } else {
        console.warn("No se pudo obtener el token de notificación");
      }
    }).catch((err) => {
      console.error("Error al obtener token de notificación", err);
    });
  }
});

onMessage(messaging, (payload) => {
  console.log("Mensaje recibido en primer plano:", payload);
  if (payload.notification) {
    alert(`${payload.notification.title}: ${payload.notification.body}`);
  }
});
