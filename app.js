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
    // Mostrar la primera categoría por defecto
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
  // Limpiar contenido
  contentDiv.innerHTML = "";

  // Crear contenedor comentarios
  const comentariosCont = document.createElement("div");
  comentariosCont.id = `comentarios-${categoria}`;
  comentariosCont.innerHTML = "<p>Cargando comentarios...</p>";
  contentDiv.appendChild(comentariosCont);

  // Crear formulario para enviar comentarios
  const form = document.createElement("form");
  form.dataset.categoria = categoria;
  form.innerHTML = `
    <input type="text" name="comentario" placeholder="Escribí tu comentario..." required />
    <button type="submit">Enviar</button>
  `;
  contentDiv.appendChild(form);

  // Mostrar comentarios en tiempo real desde Firestore
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

  // Manejar envío formulario
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

// Manejar cambio de tab
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    mostrarCategoria(tab.getAttribute("data-tab"));
  });
});

// Sincronizar cuando vuelve conexión
window.addEventListener("online", () => {
  sincronizarComentariosPendientes();
});
