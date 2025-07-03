export function crearRating(container) {
  container.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.textContent = "★";
    star.className = "calificacion";
    star.style.cursor = "pointer";
    star.onclick = () => {
      document.querySelectorAll(".calificacion").forEach((s, idx) => {
        s.classList.toggle("selected", idx < i);
      });
    };
    container.appendChild(star);
  }
}