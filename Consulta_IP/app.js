// ═══════════════════════════════════════════════
//  REFERENCIAS AL DOM
// ═══════════════════════════════════════════════
// Elementos del formulario de búsqueda
const ipInput       = document.getElementById('ipInput');
const lookupBtn     = document.getElementById('lookupBtn');
const errorMsg      = document.getElementById('errorMsg');

// Elementos de la tabla de historial
const tableBody     = document.getElementById('tableBody');
const emptyState    = document.getElementById('emptyState');
const filterInput   = document.getElementById('filterInput');

// Elementos del popup de IP duplicada
const dupOverlay    = document.getElementById('dupOverlay');
const dupIPText     = document.getElementById('dupIPText');
const closePopupBtn = document.getElementById('closePopupBtn');

// ═══════════════════════════════════════════════
//  CONFIGURACIÓN
// ═══════════════════════════════════════════════
// Credenciales de la API de RapidAPI
const API_KEY  = 'be21f372edmshb1b672ba0d349d4p1bc5d1jsn6a101aa1ac4d';
const API_HOST = 'ip-geo-location.p.rapidapi.com';

// Clave para guardar datos en localStorage
const STORAGE_KEY = 'ipscope_registros';

// ═══════════════════════════════════════════════
//  INICIALIZACIÓN
// ═══════════════════════════════════════════════
// Cargar registros guardados y renderizar tabla al iniciar
let registros = cargarRegistros();
renderizarTabla();

// ═══════════════════════════════════════════════
//  EVENTOS
// ═══════════════════════════════════════════════
// Buscar IP al hacer click en el botón
lookupBtn.addEventListener('click', buscarIP);

// Buscar IP al presionar Enter en el input
ipInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') buscarIP();
});

// Filtrar registros en tiempo real mientras el usuario escribe
filterInput.addEventListener('input', function() {
  const texto = filterInput.value.trim().toLowerCase();

  // Si el filtro está vacío, mostrar todos los registros
  if (texto === '') {
    renderizarTabla();
    return;
  }

  // Filtrar por IP, país, ciudad, ISP o timezone
  const filtrados = registros.filter(function(r) {
    return (
      r.ip.toLowerCase().includes(texto)       ||
      r.pais.toLowerCase().includes(texto)     ||
      r.ciudad.toLowerCase().includes(texto)   ||
      r.isp.toLowerCase().includes(texto)      ||
      r.timezone.toLowerCase().includes(texto)
    );
  });

  renderizarTabla(filtrados);
});

// Cerrar popup con el botón X
closePopupBtn.addEventListener('click', function() {
  dupOverlay.classList.remove('active');
});

// Cerrar popup al hacer clic fuera de él
dupOverlay.addEventListener('click', function(e) {
  if (e.target === dupOverlay) {
    dupOverlay.classList.remove('active');
  }
});

// ═══════════════════════════════════════════════
//  BÚSQUEDA DE IP
// ═══════════════════════════════════════════════
/**
 * Función principal para buscar información de una IP
 * Valida la entrada, consulta la API y guarda el resultado
 */
async function buscarIP() {
  const ip = ipInput.value.trim();

  // Validar que el campo no esté vacío
  if (ip === '') {
    mostrarError('Por favor ingresa una dirección IP.');
    return;
  }

  // Verificar si la IP ya fue consultada anteriormente
  const yaExiste = registros.find(function(r) { return r.ip === ip; });
  if (yaExiste) {
    dupIPText.textContent = ip;
    dupOverlay.classList.add('active');
    return;
  }

  // Preparar UI para la consulta
  limpiarError();
  lookupBtn.disabled = true;
  lookupBtn.textContent = 'Consultando...';

  try {
    // Consultar la API
    const datos = await consultarAPI(ip);

    // Validar que la respuesta sea exitosa
    if (datos.status !== 'success' || !datos.ip) {
      mostrarError('IP inválida o no encontrada.');
      return;
    }

    // Crear objeto con los datos relevantes
    const registro = {
      id:       Date.now(),
      ip:       datos.ip,
      pais:     datos.country.name,
      ciudad:   datos.city.name,
      isp:      datos.asn.organisation,
      timezone: datos.time.timezone,
      lat:      datos.location.latitude,
      lon:      datos.location.longitude
    };

    // Guardar registro y actualizar interfaz
    registros.unshift(registro);
    guardarRegistros();
    renderizarTabla();
    actualizarMapa(registro.lat, registro.lon, registro.ip, registro.ciudad, registro.pais);
    ipInput.value = '';

  } catch (error) {
    mostrarError('Error al consultar la API. Intenta de nuevo.');
    console.error('Error completo:', error);
  } finally {
    // Restaurar estado del botón
    lookupBtn.disabled = false;
    lookupBtn.textContent = 'Consultar';
  }
}

// ═══════════════════════════════════════════════
//  CONSULTA A LA API
// ═══════════════════════════════════════════════
/**
 * Realiza la petición HTTP a la API de RapidAPI
 * @param {string} ip - Dirección IP a consultar
 * @returns {Object} Datos de geolocalización de la IP
 */
async function consultarAPI(ip) {
  const url = `https://${API_HOST}/ip/check?format=json&ip=${ip}`;

  const respuesta = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-host': API_HOST,
      'x-rapidapi-key':  API_KEY
    }
  });

  // Validar respuesta HTTP
  if (!respuesta.ok) {
    throw new Error(`HTTP error! status: ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  return datos;
}

// ═══════════════════════════════════════════════
//  RENDERIZADO DE TABLA
// ═══════════════════════════════════════════════
/**
 * Renderiza la tabla con los registros guardados
 * @param {Array} lista - Array de registros a mostrar (opcional)
 */
function renderizarTabla(lista) {
  const datos = lista || registros;

  // Mostrar/ocultar mensaje de tabla vacía
  emptyState.style.display = datos.length === 0 ? 'block' : 'none';

  // Generar filas de la tabla
  tableBody.innerHTML = datos.map(function(r) {
    return `
      <tr class="tabla-fila" id="fila-${r.id}">
        <td>
          <button class="btn-select" onclick="seleccionarRegistro(${r.id})">
            Seleccionar
          </button>
        </td>
        <td>${r.ip}</td>
        <td>${r.pais}</td>
        <td>${r.ciudad}</td>
        <td>${r.isp}</td>
        <td>${r.timezone}</td>
        <td>${r.lat.toFixed(4)}</td>
        <td>${r.lon.toFixed(4)}</td>
        <td>
          <button class="btn-delete" onclick="eliminarRegistro(${r.id})">
            Eliminar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════
//  SELECCIÓN DE REGISTRO
// ═══════════════════════════════════════════════
/**
 * Selecciona un registro y mueve el mapa a su ubicación
 * @param {number} id - ID del registro a seleccionar
 */
function seleccionarRegistro(id) {
  const registro = registros.find(function(r) { return r.id === id; });
  
  if (registro) {
    // Remover resaltado de todas las filas
    document.querySelectorAll('.tabla-fila').forEach(function(fila) {
      fila.classList.remove('fila-activa');
    });
    
    // Resaltar la fila seleccionada
    const filaSeleccionada = document.getElementById(`fila-${id}`);
    if (filaSeleccionada) {
      filaSeleccionada.classList.add('fila-activa');
    }
    
    // Mover el mapa a la ubicación del registro
    actualizarMapa(registro.lat, registro.lon, registro.ip, registro.ciudad, registro.pais);
  }
}

// ═══════════════════════════════════════════════
//  PERSISTENCIA (localStorage)
// ═══════════════════════════════════════════════
/**
 * Guarda los registros en localStorage
 */
function guardarRegistros() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  } catch (error) {
    console.warn('⚠️ No se pudo guardar en localStorage:', error.message);
  }
}

/**
 * Carga los registros desde localStorage
 * @returns {Array} Array de registros guardados o array vacío
 */
function cargarRegistros() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    return guardado ? JSON.parse(guardado) : [];
  } catch (error) {
    console.warn('⚠️ No se pudo cargar desde localStorage:', error.message);
    return [];
  }
}

// ═══════════════════════════════════════════════
//  ELIMINACIÓN DE REGISTROS
// ═══════════════════════════════════════════════
/**
  Elimina un registro del historial
 @param {number} id - ID del registro a eliminar
 */
function eliminarRegistro(id) {
  registros = registros.filter(function(r) { return r.id !== id; });
  guardarRegistros();
  renderizarTabla();
}

// ═══════════════════════════════════════════════
//  MANEJO DE ERRORES
// ═══════════════════════════════════════════════
/**
 * Muestra un mensaje de error en la interfaz
  @param {string} mensaje - Texto del error a mostrar
 */
function mostrarError(mensaje) {
  errorMsg.textContent = mensaje;
}

/**
 Limpia el mensaje de error
 */
function limpiarError() {
  errorMsg.textContent = '';
}

// ═══════════════════════════════════════════════
//  MAPA INTERACTIVO (Leaflet.js)
// ═══════════════════════════════════════════════
let mapa = null;
let marcador = null;

/**
 * Inicializa el mapa con Leaflet.js
 */
function inicializarMapa() {
  mapa = L.map('map').setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapa);
}

/**
 * Actualiza el mapa con una nueva ubicación
 @param {number} lat - Latitud
 @param {number} lon - Longitud
 @param {string} ip - Dirección IP
 @param {string} ciudad - Ciudad
 @param {string} pais - País
 */
function actualizarMapa(lat, lon, ip, ciudad, pais) {
  // Remover marcador anterior si existe
  if (marcador) {
    mapa.removeLayer(marcador);
  }

  // Agregar nuevo marcador con popup
  marcador = L.marker([lat, lon])
    .addTo(mapa)
    .bindPopup(`<b>${ip}</b><br>${ciudad}, ${pais}`)
    .openPopup();

  // Animar el movimiento del mapa hacia la ubicación
  mapa.flyTo([lat, lon], 8);
}

// Inicializar el mapa al cargar la página
inicializarMapa();