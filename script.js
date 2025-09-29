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

  // Nuevo botón Reset
  const btnReset = document.createElement('button');
  btnReset.textContent = 'Reset';
  btnReset.addEventListener('click', () => {
    if (confirm(`¿Seguro que querés borrar todas las notas de ${nombre}?`)) {
    // Vaciar inputs
    inputsContainer.innerHTML = '';

    // Volver a crear 6 inputs vacíos
    for (let i = 0; i < 6; i++) {
      const input = crearInput(inputsContainer, nombre, i);
      inputsContainer.appendChild(input);
    }

    // Actualizar promedio
    actualizarPromedio(inputsContainer, promedioSpan);
    // Guardar cambios
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

  // Restaurar valores si existen
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
  input.className = 'nota mostrar'; // para animaciones
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
  // Solo tomamos valores > 0
  const valores = inputs
    .map(i => parseFloat(i.value))
    .filter(v => !isNaN(v) && v > 0);

  const promedio = valores.length ? (valores.reduce((a,b)=>a+b,0)/valores.length).toFixed(2) : 0;

  span.textContent = `Promedio: ${promedio}`;

  // Cambiar color según valor
  span.classList.remove('promedio-rojo','promedio-amarillo','promedio-verde');
  if (promedio < 6) span.classList.add('promedio-rojo');
  else if (promedio == 6) span.classList.add('promedio-amarillo');
  else span.classList.add('promedio-verde');

  // Cambiar tamaño según valor
  const sizeBase = 18;
  const sizeMax = 28;
  const newSize = sizeBase + (sizeMax - sizeBase) * (promedio / 10);
  span.style.fontSize = `${newSize}px`;
}


// =========================
// Guardar datos
// =========================
function guardarDatos() {
  let datos = {};
  document.querySelectorAll('.materia').forEach(div => {
    const nombre = div.querySelector('label').textContent.slice(0,-1);
    const valores = Array.from(div.querySelectorAll('.inputs-container input')).map(i => {
      let val = parseFloat(i.value);

      if (isNaN(val) || val <= 0) {
        i.value = ''; // dejar vacío si no es número o ≤ 0
        return '';
      }

      // Limitar a 10 máximo
      if (val > 10) val = 10;

      i.value = val;
      return val;
    });

    datos[nombre] = valores;
  });
  localStorage.setItem('notas', JSON.stringify(datos));
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
// Funciones con animación
// =========================
function agregarNota(container, span) {
  const input = document.createElement("input");
  input.type = "number";
  input.className = "nota";
  input.placeholder = "Nota";

  container.appendChild(input);

  // Activar animación de entrada
  setTimeout(() => input.classList.add("mostrar"), 10);

  input.addEventListener("input", () => actualizarPromedio(container, span));
}

function eliminarNota(container, span) {
  if (container.children.length > 0) {
    const ultima = container.lastElementChild;

    ultima.classList.add("ocultar"); // activar animación salida

    // esperar a que termine la animación (300ms) antes de removerlo
    setTimeout(() => {
      ultima.remove();
      actualizarPromedio(container, span);
    }, 300);
  }
}
