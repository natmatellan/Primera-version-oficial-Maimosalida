//SISTEMA JS DE INICIO DE SESION

function iniciarSesion() {
 const usernameInput = document.getElementById("usuario").value.trim();
const passwordInput = document.getElementById("clave").value;

  const errorDiv = document.getElementById("error-message");

  const usuariosValidos = {
    "admin": "1234",
    "LucasHubscher": "kabat85",
    "lucas": "pass123",
    "carla": "clave456",
    "mariana": "mariana2024"
  };


  if (usuariosValidos[usernameInput]) {
    if (usuariosValidos[usernameInput] === passwordInput) {
      // Ocultamos login y mostramos el sistema
      document.getElementById("login-container").style.display = "none";
  document.getElementById("appContent").style.display = "block";

      document.getElementById("bienvenida").textContent = `Bienvenido ${usernameInput}`;
      errorDiv.textContent = ""; // limpiamos cualquier error previo
    } else {
      errorDiv.textContent = "Contraseña incorrecta.";
    }
  } else {
    errorDiv.textContent = "Usuario no encontrado.";
  }
}

function toggleClave() {
  const input = document.getElementById("clave");
  const boton = event.currentTarget;

  const mostrando = input.type === "text";
  input.type = mostrando ? "password" : "text";

  boton.textContent = mostrando ? "👁️" : "🙈";
  boton.style.backgroundColor = mostrando ? "#4a5568" : "#48bb78";
}



//FIN SISTEMA JS DE INICIO DE SESION
  

 let datos = [
      {
        alumnos: ["Ester Esposito", "Mariana Esposito"],
        parientes: ["Lucy Liu", "Martin Esposito"],
        vehiculos: ["Ford Falcon / Verde / KQD 234", "Renault Fluence / Champagne / AI 293 IA", "Mercedes Benz 500cl / Negro / AP 931 IS"]
      },
      {
        alumnos: ["Joaquina Sosa", "Maxima Sosa"],
        parientes: ["Lucy Longin"],
        vehiculos: ["Toyota Hilux / Roja / AJW 924", "Renault Picasso / Azul / WNE 392"]
      }
    ];

    let seleccionados = { conductor: null, alumnos: [], vehiculo: null };

    function mostrarSeccion(id) {
      document.querySelectorAll(".seccion").forEach(s => s.classList.remove("activa"));
      document.getElementById(id).classList.add("activa");
      if (id === "listado") cargarListado();
    }




//PRUEBA CARGA DE FAMILIAS JSON


function cargarFamiliasDesdeServidor() {
  fetch('/api/familias')
    .then(res => res.json())
    .then(familias => {
      console.log('📥 Familias recibidas del servidor:', familias.length);
      datos = familias || [];
    })
    .catch(err => {
      console.error('❌ Error al cargar familias desde servidor:', err);
      mostrarToast('No se pudieron cargar las familias del servidor');
    });
}

//PRUEBA CARGA DE FAMILIAS JSON
  
    // =========================
// ALTA DE GRUPO NUEVO
// =========================

function agregarGrupoNuevo() {
  const inputParientes = document.getElementById("inputParientes");
  const inputAlumnos   = document.getElementById("inputAlumnos");
  const inputVehiculos = document.getElementById("inputVehiculos");
  const mensaje        = document.getElementById("mensajeAltaGrupo");
  const overlay        = document.getElementById("overlayAltaFamilia");

  if (!inputParientes || !inputAlumnos || !inputVehiculos) {
    console.warn("Faltan inputs para alta de grupo");
    return;
  }

  const parientes = inputParientes.value
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const alumnos = inputAlumnos.value
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const vehiculos = inputVehiculos.value
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length > 0);

  if (parientes.length === 0) {
    mensaje.innerHTML = `<span class="msg-error">⚠ Tenés que ingresar al menos un pariente.</span>`;
    return;
  }

  if (alumnos.length === 0) {
    mensaje.innerHTML = `<span class="msg-error">⚠ Tenés que ingresar al menos un alumno.</span>`;
    return;
  }

  const nuevoGrupo = {
    parientes,
    alumnos,
    vehiculos
  };

  datos.push(nuevoGrupo);

  // Enviar al servidor para persistir
fetch('/api/familias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(nuevoGrupo)
})
  .then(res => res.json())
  .then(data => {
    if (data.ok) {
      console.log('💾 Familia guardada en servidor. Total:', data.total);
      mostrarToast("Familia agregada con éxito");
    } else {
      console.warn('Respuesta inesperada del servidor:', data);
      mostrarToast("Familia agregada localmente, pero hubo un problema al guardar en el servidor");
    }
  })
  .catch(err => {
    console.error('❌ Error al guardar familia en servidor:', err);
    mostrarToast("Familia agregada localmente, pero no se pudo guardar en el servidor");
  });


  console.log("✅ Grupo agregado:", nuevoGrupo);
  console.log("📚 Total de grupos:", datos.length);

  // Limpiar inputs y mensaje
  inputParientes.value = "";
  inputAlumnos.value = "";
  inputVehiculos.value = "";
  mensaje.innerHTML = "";


  // Ocultar modal
  if (overlay) {
    overlay.classList.add("oculto");
  }

  // Volver al formulario principal
  const inputBusqueda = document.getElementById("busqueda");
  if (inputBusqueda) {
    inputBusqueda.focus();
  }
}


    // =========================
// ALTA DE GRUPO NUEVO
// =========================
function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = mensaje;
  toast.classList.remove("oculto");

  // Forzar reflow para activar la animación
  void toast.offsetWidth;

  toast.classList.add("mostrar");

  // Quitar después de 2.2 segundos
  setTimeout(() => {
    toast.classList.remove("mostrar");

    setTimeout(() => {
      toast.classList.add("oculto");
    }, 500); // coincide con transition de CSS
  }, 2000);
}




    document.getElementById("botonBuscar").addEventListener("click", buscar);
    document.getElementById("busqueda").addEventListener("keypress", function (e) {
      if (e.key === "Enter") buscar();
    });

function guardarRegistro() {
  const numero = document.getElementById("numeroAuto").value.trim();
  if (!seleccionados.conductor || !seleccionados.vehiculo || !numero || seleccionados.alumnos.length === 0) {
    alert("Por favor completá todos los campos obligatorios.");
    return;
  }

  const registro = {
    conductor: seleccionados.conductor.toUpperCase(),
    vehiculo: seleccionados.vehiculo.toUpperCase(),
    nroAuto: String(numero),
    alumnos: seleccionados.alumnos.map(a => a.toUpperCase())
  };

  fetch('/api/registros', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registro)
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        mostrarToast("Registro guardado correctamente.");
        // Si estás en la pestaña listado, recargamos la tabla
        cargarListado();
      } else {
        alert("Hubo un problema al guardar el registro en el servidor.");
        console.warn(data);
      }
    })
    .catch(err => {
      console.error('❌ Error al guardar registro:', err);
      alert("No se pudo guardar el registro en el servidor.");
    });

  // Reset selección y formulario
  seleccionados = { conductor: null, alumnos: [], vehiculo: null };
  document.getElementById("resultados").innerHTML = "";
  document.getElementById("numeroAuto").value = "";
}


function exportarCSV() {
  fetch('/api/registros')
    .then(res => res.json())
    .then(registros => {
      if (!registros || registros.length === 0) {
        alert("No hay registros para exportar.");
        return;
      }

      let csv = "Conductor,Vehículo,N° de Auto,Alumno/a\n";
      registros.forEach(reg => {
        reg.alumnos.forEach(alumno => {
          csv += `${reg.conductor},${reg.vehiculo},${reg.nroAuto},${alumno}\n`;
        });
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "salidas.csv";
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    })
    .catch(err => {
      console.error('❌ Error al exportar CSV:', err);
      alert("No se pudieron obtener los registros para exportar.");
    });
}



function limpiarListado() {
  if (!confirm("¿Estás seguro de que querés borrar todos los registros?")) return;

  fetch('/api/registros', { method: 'DELETE' })
    .then(res => res.json())
    .then(() => {
      cargarListado();
      mostrarToast("Listado limpiado.");
    })
    .catch(err => {
      console.error('❌ Error al limpiar registros:', err);
      alert("No se pudo limpiar el listado en el servidor.");
    });
}


function actualizarEstadoRegistro(registroIndex, alumnoIndex, campo, valor) {
  fetch('/api/registros/estado', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registroIndex, alumnoIndex, campo, valor })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        console.warn('Error al actualizar estado en servidor:', data);
      }
    })
    .catch(err => {
      console.error('❌ Error al actualizar estado en servidor:', err);
    });
}



function cargarListado() {
  fetch('/api/registros')
    .then(res => res.json())
    .then(registros => {
      const cuerpo = document.getElementById("tabla-registros");
      cuerpo.innerHTML = "";

      registros.forEach((reg, iRegistro) => {
        // Asegurar arrays por si hay registros viejos sin esos campos
        const enviados = Array.isArray(reg.enviadoAcceso)
          ? reg.enviadoAcceso
          : new Array(reg.alumnos.length).fill(false);

        const retirados = Array.isArray(reg.retirado)
          ? reg.retirado
          : new Array(reg.alumnos.length).fill(false);

        reg.alumnos.forEach((alumno, iAlumno) => {
          const fila = document.createElement("tr");
          if (reg.noAutorizado) fila.classList.add("no-autorizado");

          // Columna: Envío a acceso
          const tdAcceso = document.createElement("td");
          const cbAcceso = document.createElement("input");
          cbAcceso.type = "checkbox";
          cbAcceso.checked = !!enviados[iAlumno];

          // Clase visual
          if (cbAcceso.checked) {
            fila.classList.add("parpadeo");
          }

          cbAcceso.addEventListener("change", () => {
            fila.classList.toggle("parpadeo", cbAcceso.checked);
            actualizarEstadoRegistro(iRegistro, iAlumno, 'enviadoAcceso', cbAcceso.checked);
          });
          tdAcceso.appendChild(cbAcceso);

          // Columna: N° de Auto
          const tdAuto = document.createElement("td");
          tdAuto.textContent = reg.nroAuto;

          // Columna: Alumno
          const tdAlumno = document.createElement("td");
          tdAlumno.textContent = alumno.toUpperCase();

          // Columna: Retirado
          const tdRetirado = document.createElement("td");
          const cbRetirado = document.createElement("input");
          cbRetirado.type = "checkbox";
          cbRetirado.checked = !!retirados[iAlumno];

          if (cbRetirado.checked) {
            fila.classList.add("retirado");
          }

          cbRetirado.addEventListener("change", () => {
            fila.classList.toggle("retirado", cbRetirado.checked);
            actualizarEstadoRegistro(iRegistro, iAlumno, 'retirado', cbRetirado.checked);
          });
          tdRetirado.appendChild(cbRetirado);

          // Columna: Conductor
          const tdConductor = document.createElement("td");
          tdConductor.textContent = reg.conductor;

          // Columna: Vehículo
          const tdVehiculo = document.createElement("td");
          tdVehiculo.textContent = reg.vehiculo;
          tdVehiculo.classList.add("columna-vehiculo");

          // Armar fila
          fila.appendChild(tdAcceso);
          fila.appendChild(tdAuto);
          fila.appendChild(tdAlumno);
          fila.appendChild(tdRetirado);
          fila.appendChild(tdConductor);
          fila.appendChild(tdVehiculo);

          cuerpo.appendChild(fila);
        });
      });
    })
    .catch(err => {
      console.error('❌ Error al cargar registros:', err);
      alert("No se pudieron cargar los registros desde el servidor.");
    });
}



    document.getElementById("busqueda").addEventListener("keypress", function (e) {
      if (e.key === "Enter") buscar();
    });

function buscar() {
  const tipo = document.getElementById("tipo").value;
  const texto = document.getElementById("busqueda").value.trim().toUpperCase();
  const resultados = document.getElementById("resultados");
  resultados.innerHTML = "";
  seleccionados = { conductor: null, alumnos: [], vehiculo: null }; // reset selección

  if (!texto) return;

if (tipo === "pariente") {
  let parientesCoincidentes = [];

  datos.forEach(grupo => {
    grupo.parientes.forEach(p => {
      if (p.toUpperCase().includes(texto)) {
        parientesCoincidentes.push({ nombre: p, grupo });
      }
    });
  });

  if (parientesCoincidentes.length > 0) {
    const divConductor = document.createElement("div");
    divConductor.innerHTML = `<strong>CONDUCTOR/A:</strong>`;

    parientesCoincidentes.forEach(({ nombre, grupo }) => {
      const label = document.createElement("label");
      label.classList.add("result-item");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "conductor";
      input.addEventListener("change", () => {
        seleccionados.conductor = nombre;
        mostrarBloquesRelacionados(grupo);
      });
      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + nombre.toUpperCase()));
      divConductor.appendChild(label);
    });

    resultados.appendChild(divConductor);
  }
} else {
    const coincidencias = datos.filter(grupo =>
      grupo[tipo + 's'].some(v => v.toUpperCase().includes(texto))
    );

    coincidencias.forEach(grupo => {
      const divConductor = document.createElement("div");
      divConductor.innerHTML = `<strong>CONDUCTOR/A:</strong>`;
      grupo.parientes.forEach(p => {
        const label = document.createElement("label");
        label.classList.add("result-item");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "conductor";
        input.addEventListener("change", () => {
          seleccionados.conductor = p;
          mostrarBloquesRelacionados(grupo);
        });
        label.appendChild(input);
        label.appendChild(document.createTextNode(" " + p.toUpperCase()));
        divConductor.appendChild(label);
      });
      resultados.appendChild(divConductor);
    });
  }
}


function mostrarBloquesRelacionados(grupo) {
  const resultados = document.getElementById("resultados");

  resultados.querySelectorAll(".bloque-alumnos, .bloque-vehiculos").forEach(el => el.remove());

  // ALUMNOS
  const divAlumnos = document.createElement("div");
  divAlumnos.className = "bloque-alumnos";
  divAlumnos.innerHTML = `<strong>ALUMNO/AS RELACIONADOS:</strong>`;

  grupo.alumnos.forEach(a => {
    const label = document.createElement("label");
    label.classList.add("result-item");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.addEventListener("change", () => {
      if (input.checked) seleccionados.alumnos.push(a);
      else seleccionados.alumnos = seleccionados.alumnos.filter(n => n !== a);
    });
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + a.toUpperCase()));
    divAlumnos.appendChild(label);
  });

  // Botón para agregar alumno manual
  const botonAlumno = document.createElement("button");
  botonAlumno.textContent = "+ Agregar";
  botonAlumno.className = "boton-enviar";  // usa estilo verde
  botonAlumno.style.padding = "8px 12px";
  botonAlumno.style.fontSize = "13px";
  botonAlumno.addEventListener("click", () => agregarAlumnoManual(divAlumnos, grupo));
  divAlumnos.appendChild(botonAlumno);

  resultados.appendChild(divAlumnos);

  // VEHÍCULOS
  const divVehiculos = document.createElement("div");
  divVehiculos.className = "bloque-vehiculos";
  divVehiculos.innerHTML = `<strong>VEHÍCULOS REGISTRADOS:</strong>`;

  grupo.vehiculos.forEach(v => {
    const label = document.createElement("label");
    label.classList.add("result-item");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "vehiculo";
    input.addEventListener("change", () => {
      seleccionados.vehiculo = v;
    });
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + v.toUpperCase()));
    divVehiculos.appendChild(label);
  });

  // Botón para agregar vehículo manual
  const botonVehiculo = document.createElement("button");
  botonVehiculo.textContent = "+ Agregar";
  botonVehiculo.className = "boton-enviar";  // usa estilo verde
  botonVehiculo.style.padding = "8px 12px";
  botonVehiculo.style.fontSize = "13px";
  botonVehiculo.addEventListener("click", () => agregarVehiculoManual(divVehiculos));
  divVehiculos.appendChild(botonVehiculo);

  resultados.appendChild(divVehiculos);
}



    function mostrarManualInput() {
      document.getElementById("manualInputs").style.display = "block";
    }

function guardarManual() {
  const alumno = document.getElementById("manualAlumno").value.trim();
  const conductor = document.getElementById("manualConductor").value.trim();
  const vehiculo = document.getElementById("manualVehiculo").value.trim();
  const numero = document.getElementById("manualNumero").value.trim();
  if (!alumno || !conductor || !vehiculo || !numero) {
    alert("Completá todos los campos para registrar manualmente.");
    return;
  }

  const registro = {
    conductor: conductor.toUpperCase(),
    vehiculo: vehiculo.toUpperCase(),
    nroAuto: String(numero),
    alumnos: [alumno.toUpperCase()],
    noAutorizado: true
  };

  fetch('/api/registros', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registro)
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        mostrarToast("Registro manual guardado.");
        cargarListado();
      } else {
        alert("Hubo un problema al guardar el registro manual.");
        console.warn(data);
      }
    })
    .catch(err => {
      console.error('❌ Error al guardar registro manual:', err);
      alert("No se pudo guardar el registro manual en el servidor.");
    });

  document.getElementById("manualAlumno").value = "";
  document.getElementById("manualConductor").value = "";
  document.getElementById("manualVehiculo").value = "";
  document.getElementById("manualNumero").value = "";
  document.getElementById("manualInputs").style.display = "none";
}


    function cancel() {
            document.getElementById("manualInputs").style.display = "none";
    }


  

//DOMContentLoaded BLOQUE COMPLETO

document.addEventListener("DOMContentLoaded", () => {
  // Cargar datos iniciales
  cargarFamiliasDesdeServidor();

  const btnAgregarGrupo        = document.getElementById("btnAgregarGrupo");
  const btnMostrarAltaFamilia  = document.getElementById("btnMostrarAltaFamilia");
  const btnCancelarAltaFamilia = document.getElementById("btnCancelarAltaFamilia");
  const overlayAltaFamilia     = document.getElementById("overlayAltaFamilia");

  if (btnAgregarGrupo) {
    btnAgregarGrupo.addEventListener("click", agregarGrupoNuevo);
  }

  if (btnMostrarAltaFamilia && overlayAltaFamilia) {
    btnMostrarAltaFamilia.addEventListener("click", () => {
      overlayAltaFamilia.classList.remove("oculto");
      const inputParientes = document.getElementById("inputParientes");
      if (inputParientes) inputParientes.focus();
    });
  }

  if (btnCancelarAltaFamilia && overlayAltaFamilia) {
    btnCancelarAltaFamilia.addEventListener("click", () => {
      overlayAltaFamilia.classList.add("oculto");
    });
  }

  const btnBuscar = document.getElementById("botonBuscar");
  if (btnBuscar) {
    btnBuscar.addEventListener("click", buscar);
  }
});


//DOMContentLoaded BLOQUE COMPLETO


function agregarAlumnoManual(contenedor, grupo) {
  const nuevo = prompt("Ingresá el nombre del alumno/a:");
  if (!nuevo) return;

  const label = document.createElement("label");
  label.classList.add("result-item");
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = true;
  seleccionados.alumnos.push(nuevo);

  input.addEventListener("change", () => {
    if (input.checked) {
      seleccionados.alumnos.push(nuevo);
    } else {
      seleccionados.alumnos = seleccionados.alumnos.filter(n => n !== nuevo);
    }
  });

  label.appendChild(input);
  label.appendChild(document.createTextNode(" " + nuevo.toUpperCase()));
  contenedor.insertBefore(label, contenedor.lastElementChild);
}

function agregarVehiculoManual(contenedor) {
  const nuevo = prompt("Ingresá la descripción del vehículo:");
  if (!nuevo) return;

  const label = document.createElement("label");
  label.classList.add("result-item");
  const input = document.createElement("input");
  input.type = "radio";
  input.name = "vehiculo";
  input.checked = true;
  seleccionados.vehiculo = nuevo;

  input.addEventListener("change", () => {
    seleccionados.vehiculo = nuevo;
  });

  label.appendChild(input);
  label.appendChild(document.createTextNode(" " + nuevo.toUpperCase()));
  contenedor.insertBefore(label, contenedor.lastElementChild);
}
