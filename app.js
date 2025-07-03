import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  inicializarDB,
  guardarComentario,
  guardarComentarioPendiente,
  reenviarComentariosPendientes
} from './db.js';
import { crearRating } from './componentes/rating.js';
import { mostrarComentarios } from './componentes/listaComentarios.js';

const firebaseConfig = {
  apiKey: "AIzaSyAk0_WA4Zal3m7b_vOC70aPaQeYZqpe_00",
  authDomain: "examenpwa.firebaseapp.com",
  projectId: "examenpwa",
  storageBucket: "examenpwa.firebasestorage.app",
  messagingSenderId: "103530121016",
  appId: "1:103530121016:web:c0eef3027aa38c526063cd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const imagenesCategoria = {
  limpieza: "assets/limpieza.jpg",
  transporte: "assets/transporte.jpg",
  verdes: "assets/espaciosverdes.jpeg",
  eventos: "assets/eventos.jpg",
  subte: "assets/subte.jpg",
  seguridad: "assets/seguridad.jpg",
  accesibilidad: "assets/accesibilidad.jpg"
};

const content = document.getElementById('content');
const buttons = document.querySelectorAll('.tabs button');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout');
const loginBtn = document.getElementById('login-btn');
const googleBtn = document.getElementById('google-btn');
const welcomeText = document.getElementById('welcome');
const appContainer = document.getElementById('app');

const isLoginPage = window.location.pathname.includes("login.html");

const messaging = getMessaging(app);
const VAPID_KEY = "BNXs6Wmh8HeBnrqtZjgKdMCCYkv9vXUS2zWGjQU7SYvjqgGTz1zrxhfNmSYbN9kH1Gwn05GoEILAJ6s0DzafHLQ";

function solicitarPermisoNotificaciones() {
  Notification.requestPermission().then(permission => {
    console.log("Permiso:", permission);
    if (permission === "granted") {
      navigator.serviceWorker.ready.then(registration => {
        getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        }).then(currentToken => {
          if (currentToken) {
            console.log("Token FCM:", currentToken);
          } else {
            console.warn("No se obtuvo token");
          }
        }).catch(err => {
          console.error("Error al obtener token:", err);
        });
      });
    }
  });
}

onMessage(messaging, payload => {
  alert(payload.notification.title + ": " + payload.notification.body);
});

loginBtn.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    localStorage.setItem('userEmail', userCredential.user.email);
  } catch (e) {
    alert("Login fallido: " + e.message);
  }
});

googleBtn.addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    localStorage.setItem('userEmail', result.user.email);
  } catch (e) {
    alert("Login con Google fallido: " + e.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  localStorage.removeItem('userEmail');
});

onAuthStateChanged(auth, user => {
  if (user) {
    loginForm.style.display = "none";
    appContainer.style.display = "block";
    welcomeText.textContent = user.email;
    localStorage.setItem('userEmail', user.email);
  } else {
    loginForm.style.display = "block";
    appContainer.style.display = "none";
    localStorage.removeItem('userEmail');
  }
});

buttons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      alert("Debes iniciar sesión para comentar.");
      return;
    }

    const categoria = btn.dataset.tab;
    content.innerHTML = `
      <h2>${btn.textContent}</h2>
      <img src="${imagenesCategoria[categoria]}" alt="${categoria}" style="max-width: 100%; border-radius: 10px; margin-bottom: 1rem;">
      <label>Tu comentario:</label><br/>
      <textarea id="comentario"></textarea><br/>
      <label>Tu puntuación:</label>
      <div id="calificacion"></div>
      <button id="submit">Enviar</button>
      <h3>Comentarios anteriores:</h3>
      <div id="comentarios"></div>
    `;

    crearRating(document.getElementById('calificacion'));

    document.getElementById('submit').addEventListener('click', async () => {
      const texto = document.getElementById('comentario').value;
      const calificacion = document.querySelectorAll('.calificacion.selected').length;
      const comentario = {
        texto,
        calificacion,
        fecha: new Date().toISOString(),
        email: userEmail
      };

      if (navigator.onLine) {
        await guardarComentario(categoria, comentario);
      } else {
        await guardarComentarioPendiente(categoria, comentario);
      }

      document.getElementById('comentario').value = "";
      mostrarComentarios(categoria, document.getElementById('comentarios'));
    });

    mostrarComentarios(categoria, document.getElementById('comentarios'));
  });
});

window.addEventListener("online", async () => {
  console.log("Conexión restaurada. Enviando comentarios pendientes...");
  await reenviarComentariosPendientes();
});

inicializarDB();

const tema = localStorage.getItem('tema');
if (tema) {
  document.body.classList.add(tema);
} else {
  document.body.classList.add('claro');
}

document.getElementById('tema').addEventListener('click', () => {
  if (document.body.classList.contains('claro')) {
    document.body.classList.remove('claro');
    document.body.classList.add('oscuro');
    localStorage.setItem('tema', 'oscuro');
  } else {
    document.body.classList.remove('oscuro');
    document.body.classList.add('claro');
    localStorage.setItem('tema', 'claro');
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado:', reg.scope))
      .catch(err => console.error('Error al registrar el Service Worker:', err));
  });
}
