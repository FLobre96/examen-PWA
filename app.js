import { inicializarDB, guardarComentario, traerComentarios, guardarComentarioPendiente, revisarComentariosPendientes } from './db.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { crearRating } from './componentes/rating.js';
import { mostrarComentarios } from './componentes/listaComentarios.js';

const content = document.getElementById('content');
const buttons = document.querySelectorAll('.tabs button');

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

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const confirmEl = document.getElementById("confirm-password");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submitBtn");
const toggleBtn = document.getElementById("toggleBtn");
const googleBtn = document.getElementById("googleBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeText = document.getElementById("welcome");

const isLoginPage = window.location.pathname.includes("login.html");

// Firebase Cloud Messaging -> Configuración Notificaciones Push
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

if (isLoginPage) {
  let isLogin = true;

  toggleBtn.addEventListener("click", () => {
    isLogin = !isLogin;
    confirmEl.classList.toggle("hidden", isLogin);
    formTitle.textContent = isLogin ? "Iniciar Sesión" : "Registrarse";
    submitBtn.textContent = isLogin ? "Ingresar" : "Registrarse";
    toggleBtn.textContent = isLogin ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Ingresá";
  });

  submitBtn.addEventListener("click", () => {
    const email = emailEl.value;
    const password = passEl.value;
    const confirm = confirmEl.value;

    if (!email || !password || (!isLogin && password !== confirm)) {
      alert("Completá todos los campos correctamente");
      return;
    }

    const action = isLogin
      ? signInWithEmailAndPassword(auth, email, password)
      : createUserWithEmailAndPassword(auth, email, password);

    action
      .then(result => {
        localStorage.setItem("user", JSON.stringify({ email: result.user.email }));
        solicitarPermisoNotificaciones();
        window.location.href = "index.html";

      })
      .catch(err => alert("Las credenciales son incorrectas"));
  });

  googleBtn.addEventListener("click", () => {
    signInWithPopup(auth, provider)
      .then(result => {
        localStorage.setItem("user", JSON.stringify({ email: result.user.email }));
        solicitarPermisoNotificaciones();
        window.location.href = "index.html";
      })
      .catch(err => alert(err.message));
  });
} else {
  const saved = JSON.parse(localStorage.getItem("user"));
  if (saved?.email && welcomeText) {
    welcomeText.textContent = saved.email;
    if (logoutBtn) logoutBtn.classList.remove("hidden");

    solicitarPermisoNotificaciones();
  }


  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth).then(() => {
        localStorage.removeItem("user");
        window.location.reload();
      });
    });
  }
}

//  IndexedDB

buttons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const categoria = btn.dataset.tab;
    content.innerHTML = `
      <h2>${btn.textContent}</h2>
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
      if(navigator.onLine) {
         await guardarComentario(categoria, { texto, calificacion, fecha: new Date().toISOString() });
      } else {
        await guardarComentarioPendiente(categoria, { texto, calificacion, fecha: new Date().toISOString() });
      }
      document.getElementById('comentario').value = "";
      mostrarComentarios(categoria, document.getElementById('comentarios'));
    });

    mostrarComentarios(categoria, document.getElementById('comentarios'));
  });
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
