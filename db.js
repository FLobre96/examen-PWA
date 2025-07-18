// IndexedDB setup
let db;

export function inicializarDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("EncuestasCABA", 1);

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains("comentariosPendientes")) {
        db.createObjectStore("comentariosPendientes", {
          keyPath: "id",
          autoIncrement: true
        });
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

export function guardarComentarioPendiente(categoria, comentario) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("comentariosPendientes", "readwrite");
    const store = tx.objectStore("comentariosPendientes");
    const req = store.add({ categoria, ...comentario });
    req.onsuccess = () => resolve();
    req.onerror = () => reject();
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

export async function sincronizarComentariosPendientes() {
  await inicializarDB();

  const comentariosPendientes = await obtenerComentariosPendientes();
  if (comentariosPendientes.length === 0) return;

  // Import Firestore functions dynamically to avoid circular deps
  const { getFirestore, collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");

  // Config debe estar igual que el resto del proyecto
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
      // Eliminar del IDB si se quiere implementar eliminación
      const tx = db.transaction("comentariosPendientes", "readwrite");
      tx.objectStore("comentariosPendientes").delete(comentario.id);
    } catch (error) {
      console.error("Error sincronizando comentario pendiente:", error);
    }
  }
}
