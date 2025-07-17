import { traerComentarios } from '../db.js';
export async function mostrarComentarios(categoria, container) {
  const comentarios = await traerComentarios(categoria);
  console.log("Comentarios desde Firestore:", comentarios); // <-- AGREGÁ ESTO
  container.innerHTML = comentarios.map(c => 
    <div class="comentario">
      <strong class="puntuacion">${"★".repeat(c.calificacion)}</strong><br/>
      ${c.texto}<br/>
      <small>${new Date(c.fecha).toLocaleString()}</small>
    </div>
  ).join("");
}


