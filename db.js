// Sección: IndexedDB
let db;

export function inicializarDB() {
  const request = indexedDB.open("EncuestasCABA", 2);
request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("comentariosPendientes")) {
    db.createObjectStore("comentariosPendientes", {
      keyPath: "id",
      autoIncrement: true
    });
  }
};
  request.onsuccess = e => { db = e.target.result; };
} 

export function guardarComentarioPendiente(categoria, comentario) {
  return new Promise(resolve => {
    const tx = db.transaction("comentariosPendientes", "readwrite");
    const store = tx.objectStore("comentariosPendientes");
    store.add({ ...comentario, categoria });
    tx.oncomplete = resolve;
  });
}

export function revisarComentariosPendientes(categoria) {
  return new Promise(resolve => {
    const tx = db.transaction("comentariosPendientes", "readonly");
    const store = tx.objectStore("comentariosPendientes");
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result.filter(c => c.categoria === categoria));
    };
  });
}

// Sección: Firebase Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAk0_WA4Zal3m7b_vOC70aPaQeYZqpe_00",
  authDomain: "examenpwa.firebaseapp.com",
  projectId: "examenpwa",
  storageBucket: "examenpwa.firebasestorage.app",
  messagingSenderId: "103530121016",
  appId: "1:103530121016:web:c0eef3027aa38c526063cd"
};


const app = initializeApp(firebaseConfig);
const dbFirestore = getFirestore(app);

export async function guardarComentario(categoria, comentario) {
  try {
    await addDoc(collection(dbFirestore, "comentarios"), {
      ...comentario,
      categoria
    });
    console.log("Comentario guardado en Firestore");
  } catch (error) {
    console.error("Error al guardar comentario:", error);
  }
}

export async function traerComentarios(categoria) {
  try {
    const q = query(
      collection(dbFirestore, "comentarios"),
      where("categoria", "==", categoria)
    );

    const querySnapshot = await getDocs(q);
    const resultados = [];
    querySnapshot.forEach((doc) => {
      resultados.push(doc.data());
    });
    return resultados;
  } catch (error) {
    console.error("Error al traer comentarios:", error);
    return [];
  }
}