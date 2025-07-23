import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAk0_WA4Zal3m7b_vOC70aPaQeYZqpe_00",
  authDomain: "examenpwa.firebaseapp.com",
  projectId: "examenpwa",
  storageBucket: "examenpwa.appspot.com",
  messagingSenderId: "103530121016",
  appId: "1:103530121016:web:c0eef3027aa38c526063cd"
};

const app = initializeApp(firebaseConfig);
const dbFirestore = getFirestore(app);
let db;

export function inicializarDB() {
  const request = indexedDB.open("EncuestasCABA", 1);
  request.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("comentarios")) {
      db.createObjectStore("comentarios", { keyPath: "id", autoIncrement: true });
    } 
  };
  request.onsuccess = e => { db = e.target.result; };
}

export async function guardarComentario(categoria, comentario) {
  try {
    await addDoc(collection(dbFirestore, "comentarios"), {...comentario, categoria, fecha: new Date().toISOString()});
    console.log("Comentario guardado en Firestore");
  } catch (error) {
    console.error("Error al guardar comentario:", error);
  }
}

export function guardarComentarioPendiente(categoria, comentario) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction("pendientes", "readwrite");
      const store = tx.objectStore("pendientes");
      store.add({ ...comentario, categoria });
      tx.oncomplete = () => {
        console.log("Comentario guardado offline");
        resolve();
      };
      tx.onerror = (e) => {
        console.error("Error al guardar offline:", e);
        reject(e);
      };
    } catch (error) {
      console.error("Error en guardarComentarioPendiente:", error);
      reject(error);
    }
  });
}

export async function traerComentarios(categoria) {
  try {
    const q = query(collection(dbFirestore, "comentarios"), where("categoria", "==", categoria));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error(" Error al traer comentarios:", error);
    return [];
  }
}

export async function reenviarPendientes() {
  console.log("Ejecutando reenviarPendientes.");
  if (!db) {
    console.warn("IndexedDB no está inicializada todavía");
    return;
  }
  return new Promise((resolve, reject) => {
    const leerTx = db.transaction("pendientes", "readonly");
    const storeLeer = leerTx.objectStore("pendientes");
    const request = storeLeer.getAll();
    request.onsuccess = async () => {
      const pendientes = request.result;
      console.log("Comentarios pendientes encontrados");
      for (const comentario of pendientes) {
        try {
          await addDoc(collection(dbFirestore, "comentarios"), {...comentario, fecha: new Date().toISOString()});
          const borrarTx = db.transaction("pendientes", "readwrite");
          const storeBorrar = borrarTx.objectStore("pendientes");
          storeBorrar.delete(comentario.id);
        } catch (error) {
          console.error("Error reenviando comentario:", error);
          reject(error);
          return;
        }
      }
      resolve(); 
    };
    request.onerror = (e) => {
      console.error("Error al leer los comentarios pendientes:", e);
      reject(e);
    };
  });
}