# GeoReviews Platform 📍

Plataforma Full Stack robusta para la gestión de reseñas de establecimientos, integrando geolocalización en tiempo real, microservicios y almacenamiento en la nube.

🚀 Características Principales

* **Geocoding Dinámico**: El sistema utiliza la API de Nominatim (OpenStreetMap) para convertir automáticamente direcciones postales en coordenadas GPS (latitud/longitud).
* **Visualización en Mapas**: Integración con Leaflet.js para mostrar marcadores interactivos basados en los datos almacenados en MongoDB.
* **Gestión de Multimedia**: Procesamiento y alojamiento de imágenes mediante la API de Cloudinary.
* **Arquitectura de Microservicios**: Backend desacoplado desarrollado con FastAPI y preparado para despliegue en contenedores.
* **Seguridad y Autenticación**: Autenticación gestionada con Firebase Auth (Google Sign-In) y validación de tokens JWT en el servidor para proteger las operaciones de creación.
* **Persistencia NoSQL**: Uso de MongoDB con índices geoespaciales (2dsphere) para optimizar la búsqueda por ubicación.

## 🛠️ Stack Tecnológico

* **Backend**: Python 3.12, FastAPI, PyJWT.
* **Frontend**: JavaScript (ES6+), Leaflet, CSS3 con soporte para Modo Oscuro.
* **Base de Datos**: MongoDB (Motor / Pymongo).
* **DevOps**: Docker & Docker Compose.
* **Servicios Externos**: Cloudinary (Media), Firebase (Auth), OpenStreetMap (Geocoding).

## 🔧 Configuración del Proyecto

### Requisitos Previos
* Docker y Docker Compose
* Cuenta en Cloudinary y Firebase

### Instalación
1. Clonar el repositorio.
2. Configurar las variables de entorno en un archivo `.env`:
   ```env
   MONGO_URI=tu_uri_de_mongodb
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
