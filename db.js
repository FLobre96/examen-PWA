// db.js
let db;

export function inicializarDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("EncuestasCABA", 1);

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains("comentarios")) {
        db.createObjectStore("comentarios", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("comentariosPendientes")) {
        db.createObjectStore("comentariosPendientes", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}


export function guardarComentario(categoria, comentario) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("comentarios", "readwrite");
    const store = tx.objectStore("comentarios");
    const req = store.add({ ...comentario, categoria });
    req.onsuccess = () => resolve();
    req.onerror = () => reject();
  });
}


export function guardarComentarioPendiente(categoria, comentario) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("comentariosPendientes", "readwrite");
    const store = tx.objectStore("comentariosPendientes");
    const req = store.add({ categoria, ...comentario });
    req.onsuccess = () => resolve();
    req.onerror = () => reject();
  });
}


export function traerComentarios(categoria) {
  return new Promise((resolve) => {
    const tx = db.transaction("comentarios", "readonly");
    const store = tx.objectStore("comentarios");
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result.filter(c => c.categoria === categoria));
    };
  });
}

export function obtenerComentariosPendientes() {
  return new Promise((resolve) => {
    const tx = db.transaction("comentariosPendientes", "readonly");
    const store = tx.objectStore("comentariosPendientes");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}


export function reenviarComentariosPendientes() {
  return new Promise((resolve) => {
    const tx = db.transaction("comentariosPendientes", "readwrite");
    const store = tx.objectStore("comentariosPendientes");
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = async () => {
      const pendientes = getAllRequest.result;

      for (const comentario of pendientes) {
        try {
          await guardarComentario(comentario.categoria, comentario);
          store.delete(comentario.id); 
        } catch (e) {
          console.error("Error reenviando comentario pendiente:", e);
        }
      }

      resolve();
    };
  });
}


export async function sincronizarComentariosPendientes() {
  await inicializarDB();
  const comentariosPendientes = await obtenerComentariosPendientes();
  if (comentariosPendientes.length === 0) return;

  const { getFirestore, collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");

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

  for (const comentario of comentariosPendientes) {
    try {
      await addDoc(collection(dbFirestore, "comentarios"), comentario);
      const tx = db.transaction("comentariosPendientes", "readwrite");
      tx.objectStore("comentariosPendientes").delete(comentario.id);
    } catch (error) {
      console.error("Error sincronizando comentario pendiente:", error);
    }
  }
}
