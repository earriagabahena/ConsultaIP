// ─── Referencias al HTML ──────────────────────
const ipInput       = document.getElementById('ipInput');
const lookupBtn     = document.getElementById('lookupBtn');
const errorMsg      = document.getElementById('errorMsg');
const tableBody     = document.getElementById('tableBody');
const emptyState    = document.getElementById('emptyState');
const filterInput   = document.getElementById('filterInput');
const dupOverlay    = document.getElementById('dupOverlay');
const dupIPText     = document.getElementById('dupIPText');
const closePopupBtn = document.getElementById('closePopupBtn');

// ─── Configuración RapidAPI ───────────────────
const API_KEY  = 'be21f372edmshb1b672ba0d349d4p1bc5d1jsn6a101aa1ac4d';
const API_HOST = 'ip-geo-location.p.rapidapi.com';

// ─── Clave para localStorage ──────────────────
const STORAGE_KEY = 'ipscope_registros';

// ─── Cargar registros al iniciar ──────────────
let registros = cargarRegistros();
renderizarTabla();

// ─── Eventos ──────────────────────────────────
lookupBtn.addEventListener('click', buscarIP);

ipInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') buscarIP();
});

// Filtrar mientras el usuario escribe
filterInput.addEventListener('input', function() {
  const texto = filterInput.value.trim().toLowerCase();

  if (texto === '') {
    renderizarTabla();
    return;
  }

  const filtrados = registros.filter(function(r) {
    return (
      r.ip.toLowerCase().includes(texto)     ||
      r.pais.toLowerCase().includes(texto)   ||
      r.ciudad.toLowerCase().includes(texto) ||
      r.isp.toLowerCase().includes(texto)    ||
      r.timezone.toLowerCase().includes(texto)
    );
  });

  renderizarTabla(filtrados);
});

// Cerrar popup con el botón
closePopupBtn.addEventListener('click', function() {
  dupOverlay.classList.remove('active');
});

// Cerrar popup haciendo clic fuera
dupOverlay.addEventListener('click', function(e) {
  if (e.target === dupOverlay) {
    dupOverlay.classList.remove('active');
  }
});

// ─── Función principal de búsqueda ───────────
async function buscarIP() {
  const ip = ipInput.value.trim();

  if (ip === '') {
    mostrarError('Por favor ingresa una dirección IP.');
    return;
  }

  // Verificar si la IP ya existe
  const yaExiste = registros.find(function(r) { return r.ip === ip; });
  if (yaExiste) {
    dupIPText.textContent = ip;
    dupOverlay.classList.add('active');
    return;
  }

  limpiarError();
  lookupBtn.disabled = true;
  lookupBtn.textContent = 'Consultando...';

  try {
    const datos = await consultarAPI(ip);

    // Verificar si la consulta fue exitosa
    if (datos.status !== 'success' || !datos.ip) {
      mostrarError('IP inválida o no encontrada.');
      return;
    }

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

    registros.unshift(registro);
    guardarRegistros();
    renderizarTabla();
    actualizarMapa(registro.lat, registro.lon, registro.ip, registro.ciudad, registro.pais);
    ipInput.value = '';

  } catch (error) {
    mostrarError('Error al consultar la API. Intenta de nuevo.');
    console.error('Error completo:', error);
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.textContent = 'Consultar';
  }
}

// ─── Llamada a RapidAPI ───────────────────────
async function consultarAPI(ip) {
  // Endpoint correcto: /ip/check con parámetros
  const url = `https://${API_HOST}/ip/check?format=json&ip=${ip}`;

  const respuesta = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-host': API_HOST,
      'x-rapidapi-key':  API_KEY
    }
  });

  if (!respuesta.ok) {
    throw new Error(`HTTP error! status: ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  console.log('✅ Respuesta de la API:', datos);
  return datos;
}

// ─── Renderizar tabla ─────────────────────────
function renderizarTabla(lista) {
  const datos = lista || registros;

  emptyState.style.display = datos.length === 0 ? 'block' : 'none';

  tableBody.innerHTML = datos.map(function(r) {
    return `
      <tr>
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

// ─── Seleccionar registro y mover mapa ────────
function seleccionarRegistro(id) {
  const registro = registros.find(function(r) { return r.id === id; });
  
  if (registro) {
    // Remover clase active de todas las filas
    document.querySelectorAll('.tabla-fila').forEach(function(fila) {
      fila.classList.remove('fila-activa');
    });
    
    // Agregar clase active a la fila seleccionada
    event.currentTarget.classList.add('fila-activa');
    
    // Mover el mapa a la ubicación
    actualizarMapa(registro.lat, registro.lon, registro.ip, registro.ciudad, registro.pais);
  }
}


// ─── localStorage ─────────────────────────────
// ─── localStorage con manejo de errores ───────
function guardarRegistros() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  } catch (error) {
    console.warn('⚠️ No se pudo guardar en localStorage:', error.message);
    // Continuar sin guardar (solo en memoria durante la sesión)
  }
}

function cargarRegistros() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    return guardado ? JSON.parse(guardado) : [];
  } catch (error) {
    console.warn('⚠️ No se pudo cargar desde localStorage:', error.message);
    return [];
  }
}

// ─── Eliminar registro ────────────────────────
function eliminarRegistro(id) {
  registros = registros.filter(function(r) { return r.id !== id; });
  guardarRegistros();
  renderizarTabla();
}

// ─── Helpers de error ─────────────────────────
function mostrarError(mensaje) {
  errorMsg.textContent = mensaje;
}

function limpiarError() {
  errorMsg.textContent = '';
}

// ═══════════════════════════════════════════════
//  MAPA — Leaflet.js
// ═══════════════════════════════════════════════

let mapa = null;
let marcador = null;

function inicializarMapa() {
  mapa = L.map('map').setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapa);
}

function actualizarMapa(lat, lon, ip, ciudad, pais) {
  if (marcador) {
    mapa.removeLayer(marcador);
  }

  marcador = L.marker([lat, lon])
    .addTo(mapa)
    .bindPopup(`<b>${ip}</b><br>${ciudad}, ${pais}`)
    .openPopup();

  mapa.flyTo([lat, lon], 8);
}

inicializarMapa();