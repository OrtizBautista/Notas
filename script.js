// =========================
// Variables iniciales
// =========================
let materiasIniciales = [
  "Formación C", "Inglés", "Psicología", "Literatura", "Fabricación Digital",
  "Química", "Programación", "Automatización", "Economía", "Ciudadanía", "Matemáticas"
];

const contenedor = document.getElementById('contenedorMaterias');
const selector = document.getElementById('selectorTema');

// Cargar datos guardados si existen
let datosGuardados = JSON.parse(localStorage.getItem('notas')) || {};

// =========================
// Crear materias
// =========================
materiasIniciales.forEach(nombre => crearMateria(nombre));

function crearMateria(nombre) {
  const div = document.createElement('div');
  div.className = 'materia';

  const inputsContainer = document.createElement('div');
  inputsContainer.className = 'inputs-container';

  for (let i = 0; i < 6; i++) {
    const input = crearInput(inputsContainer, nombre, i);
    inputsContainer.appendChild(input);
  }

  const promedioSpan = document.createElement('span');
  promedioSpan.textContent = 'Promedio: 0'; 
  promedioSpan.setAttribute("data-tooltip", "Rojo: < 6 | Amarillo: = 6 | Verde: > 6");

  const btnAgregar = document.createElement('button');
  btnAgregar.textContent = '+';
  btnAgregar.addEventListener('click', () => {
    if (inputsContainer.children.length < 8) {
      agregarNota(inputsContainer, promedioSpan);
      actualizarPromedio(inputsContainer, promedioSpan);
      guardarDatos();
    }
  });

  const btnEliminar = document.createElement('button');
  btnEliminar.textContent = '-';
  btnEliminar.addEventListener('click', () => {
    if (inputsContainer.children.length > 1) {
      eliminarNota(inputsContainer, promedioSpan);
      guardarDatos();
    }
  });

  const btnReset = document.createElement('button');
  btnReset.textContent = 'Reset';
  btnReset.addEventListener('click', () => {
    if (confirm(`¿Seguro que querés borrar todas las notas de ${nombre}?`)) {
      inputsContainer.innerHTML = '';
      for (let i = 0; i < 6; i++) {
        const input = crearInput(inputsContainer, nombre, i);
        inputsContainer.appendChild(input);
      }
      actualizarPromedio(inputsContainer, promedioSpan);
      guardarDatos();
    }
  });

  div.innerHTML = `<label>${nombre}:</label>`;
  div.appendChild(inputsContainer);
  div.appendChild(btnAgregar);
  div.appendChild(btnEliminar);
  div.appendChild(btnReset);
  div.appendChild(promedioSpan);

  contenedor.appendChild(div);

  if (datosGuardados[nombre]) {
    datosGuardados[nombre].forEach((valor, index) => {
      if (inputsContainer.children[index]) {
        inputsContainer.children[index].value = valor;
      }
    });
  }

  actualizarPromedio(inputsContainer, promedioSpan);
}

// =========================
// Crear input
// =========================
function crearInput(container, materia, index) {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = 0;
  input.max = 10;
  input.className = 'nota mostrar';
  input.addEventListener('input', () => {
    const promedioSpan = container.parentElement.querySelector('span');
    actualizarPromedio(container, promedioSpan);
    guardarDatos();
  });

  if (datosGuardados[materia] && datosGuardados[materia][index] !== undefined) {
    input.value = datosGuardados[materia][index];
  }

  return input;
}

// =========================
// Promedio
// =========================
function actualizarPromedio(container, span) {
  const inputs = Array.from(container.children);
  const valores = inputs
    .map(i => parseFloat(i.value))
    .filter(v => !isNaN(v) && v > 0);

  const promedio = valores.length ? (valores.reduce((a,b)=>a+b,0)/valores.length).toFixed(2) : 0;

  span.textContent = `Promedio: ${promedio}`;
  span.classList.remove('promedio-rojo','promedio-amarillo','promedio-verde');
  if (promedio < 6) span.classList.add('promedio-rojo');
  else if (promedio == 6) span.classList.add('promedio-amarillo');
  else span.classList.add('promedio-verde');

  const sizeBase = 18;
  const sizeMax = 28;
  const newSize = sizeBase + (sizeMax - sizeBase) * (promedio / 10);
  span.style.fontSize = `${newSize}px`;
}

// =========================
// Guardar datos (localStorage + Firestore)
// =========================
function guardarDatos() {
  let datos = {};
  document.querySelectorAll('.materia').forEach(div => {
    const nombre = div.querySelector('label').textContent.slice(0,-1);
    const valores = Array.from(div.querySelectorAll('.inputs-container input')).map(i => {
      let val = parseFloat(i.value);
      if (isNaN(val) || val <= 0) {
        i.value = '';
        return '';
      }
      if (val > 10) val = 10;
      i.value = val;
      return val;
    });
    datos[nombre] = valores;
  });
  localStorage.setItem('notas', JSON.stringify(datos));

  // Si hay usuario activo, guardar en Firestore
  if (usuarioActivo) {
    guardarNotasFirestore(usuarioActivo.uid, datos);
  }
}

// =========================
// Funciones con animación
// =========================
function agregarNota(container, span) {
  const input = document.createElement("input");
  input.type = "number";
  input.className = "nota";
  input.placeholder = "Nota";

  container.appendChild(input);
  setTimeout(() => input.classList.add("mostrar"), 10);

  input.addEventListener("input", () => actualizarPromedio(container, span));
}

function eliminarNota(container, span) {
  if (container.children.length > 0) {
    const ultima = container.lastElementChild;
    ultima.classList.add("ocultar");
    setTimeout(() => {
      ultima.remove();
      actualizarPromedio(container, span);
    }, 300);
  }
}

// =========================
// Manejo de temas
// =========================
selector.addEventListener('change', () => {
  cambiarTema(selector.value);
  localStorage.setItem('temaSeleccionado', selector.value);
});

const temaGuardado = localStorage.getItem('temaSeleccionado') || 'inosuke';
cambiarTema(temaGuardado);
selector.value = temaGuardado;

function cambiarTema(tema) {
  document.body.classList.remove('tema-inosuke', 'tema-harrypotter', 'tema-beemail', 'tema-oscuro', 'tema-azul');
  document.body.classList.add(`tema-${tema}`);
}

// =========================
// Firebase (Auth + Firestore)
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqDmMrSxcIclOHtMFPElhZErsRxXxSSsY",
  authDomain: "mis-notas-7190e.firebaseapp.com",
  projectId: "mis-notas-7190e",
  storageBucket: "mis-notas-7190e.firebasestorage.app",
  messagingSenderId: "939705111999",
  appId: "1:939705111999:web:552a854c3b1f0c53473d0a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// =========================
// Guardar / cargar Firestore
// =========================
async function guardarNotasFirestore(userId, notas) {
  try {
    await setDoc(doc(db, "notas", userId), { lista: notas });
    console.log("Notas guardadas en Firestore ✅");
  } catch (error) {
    console.error("Error al guardar en Firestore:", error);
  }
}

async function cargarNotasFirestore(userId) {
  try {
    const snap = await getDoc(doc(db, "notas", userId));
    if (snap.exists()) return snap.data().lista;
    else return {};
  } catch (error) {
    console.error("Error al cargar de Firestore:", error);
    return {};
  }
}

// =========================
// Login / Logout
// =========================
let usuarioActivo = null;

document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    usuarioActivo = result.user;
    alert("Bienvenido " + usuarioActivo.displayName);

    const notasRemotas = await cargarNotasFirestore(usuarioActivo.uid);
    if (Object.keys(notasRemotas).length > 0) {
      localStorage.setItem("notas", JSON.stringify(notasRemotas));
      location.reload();
    }
  } catch (error) {
    console.error("Error en login:", error);
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    usuarioActivo = null;
    alert("Sesión cerrada");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
});
