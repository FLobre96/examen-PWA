import { inicializarDB, guardarComentario, guardarComentarioPendiente, reenviarPendientes } from './db.js';
import { crearRating } from './componentes/rating.js';
import { mostrarComentarios } from './componentes/listaComentarios.js';

const content = document.getElementById('content');
const buttons = document.querySelectorAll('.tabs button');
const usuario = localStorage.getItem("user");

document.addEventListener("DOMContentLoaded", () => {
    const boton = document.querySelector(".permiso");
    if (!boton) return;

    boton.style.transition = "opacity 0.6s ease";

    boton.addEventListener("click", function () {
      this.textContent = "Notificaciones activas";

      setTimeout(() => {
        this.style.opacity = "0";

        setTimeout(() => {
          this.style.display = "none";
        }, 600); 
      }, 2000); 
    });
});

if (!usuario) {
  alert("Debes iniciar sesión o entrar como invitado.");
  window.location.href = "login.html";
}

const esInvitado = usuario === "invitado";

window.logout = function () {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

buttons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const categoria = btn.dataset.tab;
    content.innerHTML = `
      <h2>${btn.textContent}</h2>
      <img src=${btn.dataset.img} class="descripcionIMG"/>
      <label class="coment">Dejanos tu comentario</label><br/>
      <textarea id="comentario"></textarea><br/>
      <label>Calificanos</label>
      <div id="calificacion"></div>
      <button id="submit">Enviar</button>
      <h3>Comentarios anteriores:</h3>
      <div id="comentarios"></div>
    `;
    crearRating(document.getElementById('calificacion'));

   document.getElementById('submit').addEventListener('click', async () => {
      if (esInvitado) {
        alert("Debes iniciar sesión para enviar un comentario.");
        return;
      }
      const texto = document.getElementById('comentario').value;
      const calificacion = document.querySelectorAll('.calificacion.selected').length;
      const comentario = {texto, calificacion, fecha: new Date().toISOString(), email: usuario};
      if (navigator.onLine) {
        await guardarComentario(categoria, comentario);
        mostrarComentarios(categoria, document.getElementById('comentarios'));
        console.log("Comentario enviado a Firestore");
      } else {
        await guardarComentarioOFF(categoria, comentario);
        content.textContent = "Sin conexión. Guardado localmente.";
      }
      document.getElementById('comentario').value = "";
    });

    mostrarComentarios(categoria, document.getElementById('comentarios'));
  });
});

window.addEventListener("online", async () => {
  console.log("Conexión restaurada");
  await reenviarPendientes();
  console.log("Comentarios pendientes reenviados correctamente");
  const categoriaActual = localStorage.getItem("categoriaActual");
  if (categoriaActual) {
    const contenedor = document.getElementById('comentarios');
    if (contenedor) {
      mostrarComentarios(categoriaActual, contenedor);
    }
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado:', reg.scope))
      .catch(err => console.error('Error al registrar el Service Worker:', err));
  });
}

inicializarDB();
window.addEventListener('DOMContentLoaded', () => {
  if (buttons.length > 0) {
    buttons[0].dispatchEvent(new Event('click'));
  }
});