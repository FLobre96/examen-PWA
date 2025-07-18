import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getMessaging,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

import { guardarComentarioPendiente, sincronizarComentariosPendientes } from "./db.js";

const firebaseConfig = {
  apiKey: "AIzaSyAk0_WA4Zal3m7b_vOC70aPaQeYZqpe_00",
  authDomain: "examenpwa.firebaseapp.com",
  projectId: "examenpwa",
  storageBucket: "examenpwa.appspot.com",
  messagingSenderId: "103530121016",
  appId: "1:103530121016:web:c0eef3027aa38c526063cd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

// Registrar Service Worker para FCM
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
  .then(registration => {
    console.log('Service Worker registrado:', registration);
  }).catch(err => {
    console.error('Error registrando Service Worker:', err);
  });
}

// Manejar mensajes en primer plano con onMessage
onMessage(messaging, (payload) => {
  console.log('Mensaje recibido en primer plano:', payload);
  alert("FCM recibido (test)."); // Para confirmar si entra
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        registration.showNotification("Test Notificación", {
          body: "Notificación mostrada por Service Worker.",
          icon: "icon.png"
        });
      } else {
        alert("No hay Service Worker registrado.");
      }
    });
  } else {
    alert("No hay permiso de notificaciones.");
  }
});

// --- Tu código original sigue igual ---

const logoutBtn = document.getElementById("logout");
const welcomeText = document.getElementById("welcome");
const appDiv = document.getElementById("app");
const loginForm = document.getElementById("login-form");
const contentDiv = document.getElementById("content");
const tabs = document.querySelectorAll(".tabs button[data-tab]");

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
  });
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    appDiv.style.display = "block";
    loginForm.style.display = "none";
    welcomeText.textContent = user.email;
    sincronizarComentariosPendientes();
    
    if (tabs.length > 0) {
      mostrarCategoria(tabs[0].getAttribute("data-tab"));
      tabs[0].classList.add("active");
    }
  } else {
    appDiv.style.display = "none";
    loginForm.style.display = "block";
  }
});

function mostrarCategoria(categoria) {
  contentDiv.innerHTML = "";

  const comentariosCont = document.createElement("div");
  comentariosCont.id = `comentarios-${categoria}`;
  comentariosCont.innerHTML = "<p>Cargando comentarios...</p>";
  contentDiv.appendChild(comentariosCont);

  const form = document.createElement("form");
  form.dataset.categoria = categoria;
  form.innerHTML = `
    <input type="text" name="comentario" placeholder="Escribí tu comentario..." required />
    <button type="submit">Enviar</button>
  `;
  contentDiv.appendChild(form);

  const q = query(
    collection(db, "comentarios"),
    where("categoria", "==", categoria),
    orderBy("timestamp", "desc")
  );

  onSnapshot(q, (snapshot) => {
    comentariosCont.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.classList.add("comentario");
      div.textContent = `${data.usuario}: ${data.comentario}`;
      comentariosCont.appendChild(div);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = form.querySelector("input[name='comentario']");
    const texto = input.value.trim();
    if (!texto) return;

    const user = auth.currentUser;
    if (!user) {
      alert("Debes iniciar sesión para enviar comentarios.");
      return;
    }

    const nuevoComentario = {
      usuario: user.email,
      comentario: texto,
      categoria,
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "comentarios"), nuevoComentario);
      input.value = "";
    } catch (error) {
      console.error("No se pudo enviar, guardando offline", error);
      await guardarComentarioPendiente(categoria, nuevoComentario);
      input.value = "";
      alert("No tienes conexión, tu comentario se guardará y enviará cuando recuperes la conexión.");
    }
  });
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    mostrarCategoria(tab.getAttribute("data-tab"));
  });
});

window.addEventListener("online", () => {
  sincronizarComentariosPendientes();
});
