# Plataforma de Consulta de IPs

Aplicación web para consultar información detallada de direcciones IP con historial persistente y visualización en mapa interactivo.

![IPScope Preview](https://placehold.co/800x400/8b7355/ffffff?text=IPScope+Preview)

---

## Proyecto en vivo

**[Ver proyecto desplegado](https://earriagabahena.github.io/ConsultaIP/)**

---

## 📋 Características

✅ **Consulta de IPs** - Información detallada en tiempo real (país, ciudad, ISP, timezone, coordenadas)  
✅ **Historial persistente** - Los datos se guardan automáticamente en localStorage  
✅ **Filtrado en tiempo real** - Busca por IP, país, ciudad, ISP o timezone  
✅ **Detección de duplicados** - Popup de alerta si la IP ya fue consultada  
✅ **Navegación en mapa** - Selecciona cualquier registro para ver su ubicación  
✅ **Mapa interactivo** - Visualización con Leaflet.js y OpenStreetMap  
✅ **100% Responsive** - Diseño adaptable a móviles, tablets y desktop  

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|------------|-----|
| **HTML5** | Estructura semántica |
| **CSS3** | Diseño responsive con media queries |
| **JavaScript (ES6+)** | Lógica de la aplicación (vanilla JS) |
| **Leaflet.js** | Mapas interactivos |
| **RapidAPI** | API de geolocalización de IPs |
| **localStorage** | Persistencia de datos |

---

## 📦 Estructura del proyecto

# Consulta_IP/
├── index.html          # Estructura HTML
├── style.css           # Estilos y responsive
├── app.js              # Lógica de la aplicación
└── README.md           # Documentación