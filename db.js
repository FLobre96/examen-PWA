let db;

export function inicializarDB() {
  const request = indexedDB.open("EncuestasCABA", 1);

  request.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("comentarios")) {
      db.createObjectStore("comentarios", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("comentariosPendientes")) {
      db.createObjectStore("comentariosPendientes", { keyPath: "id", autoIncrement: true });
    }
  };

  request.onsuccess = e => {
    db = e.target.result;
  };
}

export function guardarComentario(categoria, comentario) {
  return new Promise(resolve => {
    const tx = db.transaction("comentarios", "readwrite");
    const store = tx.objectStore("comentarios");
    store.add({ ...comentario, categoria });
    tx.oncomplete = resolve;
  });
}

export function guardarComentarioPendiente(categoria, comentario) {
  return new Promise(resolve => {
    const tx = db.transaction("comentariosPendientes", "readwrite");
    const store = tx.objectStore("comentariosPendientes");
    store.add({ ...comentario, categoria });
    tx.oncomplete = resolve;
  });
}

export function traerComentarios(categoria) {
  return new Promise(resolve => {
    const tx = db.transaction("comentarios", "readonly");
    const store = tx.objectStore("comentarios");
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result.filter(c => c.categoria === categoria));
    };
  });
}

export function reenviarComentariosPendientes() {
  return new Promise(resolve => {
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
