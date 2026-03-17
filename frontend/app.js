// app.js
// ========================= CONFIGURACIÓN =========================

//const API_BASE = "http://localhost:8080"; //(Para local)
const API_BASE = "https://segundo-parcial-iw-2025.onrender.com"; //(Para nube)

// FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCf9T3fPEWBbJMzIdUnPiF97h3FRy-cFxQ",
  authDomain: "proyecto-geolocalizacion-f0576.firebaseapp.com",
  projectId: "proyecto-geolocalizacion-f0576",
  storageBucket: "proyecto-geolocalizacion-f0576.firebasestorage.app",
  messagingSenderId: "1046953498155",
  appId: "1:1046953498155:web:cb261afd62a49c48eb3c6e",
  measurementId: "G-B3WEJBG4Y8"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// VARIABLES GLOBALES
let map = null;
let markersLayer = null;
let currentToken = null;

// Acumulador de archivos seleccionados
let selectedFiles = []; 

// =================== INIT ===================
document.addEventListener("DOMContentLoaded", () => {
    const isLogin = document.getElementById('login-btn');
    const isIndex = document.getElementById('map');
    
    // Tema
    initTheme();

    // Observador Auth
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentToken = await user.getIdToken();
            if (isLogin) window.location.href = "index.html";
            if (isIndex) {
                document.getElementById('user-info').textContent = user.email;
                initMap();
                loadReviews();
            }
        } else {
            currentToken = null;
            if (isIndex) window.location.href = "login.html";
        }
    });

    // Eventos Login/Logout
    if (isLogin) {
        document.getElementById('login-btn').addEventListener('click', () => {
            signInWithPopup(auth, googleProvider).catch(e => alert(e.message));
        });
    }
    if (isIndex) {
        document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
        initCreateReview();
        initMapSearch();
    }
});

function initTheme() {
    const btn = document.getElementById('theme-toggle');
    if(btn) {
        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
            btn.textContent = current === 'dark' ? '🌙' : '☀️';
        });
    }
}

// =================== MAPA ===================
function initMap() {
    if (!document.getElementById('map')) return;
    map = L.map('map').setView([36.7213, -4.4214], 13); // Málaga
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    markersLayer = L.layerGroup().addTo(map);
}

function initMapSearch() {
    const btn = document.getElementById('map-search-btn');
    const input = document.getElementById('map-search-input');
    
    btn.addEventListener('click', async () => {
        const query = input.value;
        if(!query) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`);
            const data = await res.json();
            if(data && data.length > 0) {
                const { lat, lon } = data[0];
                map.setView([lat, lon], 15);
            } else {
                alert("Dirección no encontrada");
            }
        } catch(e) { console.error(e); }
    });
}

// =================== LOGICA RESEÑAS ===================
async function loadReviews() {
    try {
        const res = await fetch(`${API_BASE}/resenas/`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const reviews = await res.json();
        renderReviews(reviews);
        renderMarkers(reviews);
    } catch (e) { console.error("Error cargando reseñas", e); }
}

function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');
    container.innerHTML = "";
    
    reviews.forEach(r => {
        const div = document.createElement('div');
        div.className = "review-item-card";
        div.style.border = "1px solid var(--border-color)";
        div.style.padding = "1rem";
        div.style.marginBottom = "1rem";
        div.style.borderRadius = "8px";
        
        let coordsText = "No disp.";
        if (r.coordenadas && r.coordenadas.coordinates) {
             const lon = r.coordenadas.coordinates[0];
             const lat = r.coordenadas.coordinates[1];
             coordsText = `${lon}, ${lat}`;
        }

        div.innerHTML = `
            <h3>${r.nombre_establecimiento}</h3>
            <p><strong>Dirección:</strong> ${r.direccion_postal}</p>
            <p class="small"><strong>GPS (lon, lat):</strong> ${coordsText}</p>
            <p><strong>Valoración:</strong> ${r.valoracion} / 5</p>
            <button class="detail-btn">Ver Detalle</button>
        `;
        
        div.querySelector('.detail-btn').addEventListener('click', () => loadDetail(r.id));
        container.appendChild(div);
    });
}

function renderMarkers(reviews) {
    if(!map || !markersLayer) return;
    markersLayer.clearLayers();
    
    reviews.forEach(r => {
        if(r.coordenadas && r.coordenadas.coordinates) {
            const [lon, lat] = r.coordenadas.coordinates; 
            L.marker([lat, lon]).addTo(markersLayer)
             .bindPopup(`<b>${r.nombre_establecimiento}</b><br>Nota: ${r.valoracion}`);
        }
    });
}

async function loadDetail(id) {
    try {
        const res = await fetch(`${API_BASE}/resenas/${id}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const r = await res.json();
        
        const section = document.getElementById('detail-section');
        const content = document.getElementById('detail-content');
        section.hidden = false;
        
        const iat = r.datos_token?.iat ? new Date(r.datos_token.iat * 1000).toLocaleString() : '-';
        const exp = r.datos_token?.exp ? new Date(r.datos_token.exp * 1000).toLocaleString() : '-';
        
        // CORRECCIÓN: Estructura para mostrar imágenes en fila con título
        let imgsHtml = "";
        if(r.imagenes && r.imagenes.length > 0) {
            imgsHtml = `
                <h4>Imágenes Subidas</h4>
                <div class="detail-images-row">
                    ${r.imagenes.map(src => `<img src="${src}" class="detail-image-thumb" alt="Imagen de la reseña">`).join('')}
                </div>
            `;
        }
        
        content.innerHTML = `
            <h3>${r.nombre_establecimiento}</h3>
            <p><strong>Autor:</strong> ${r.autor_nombre} (${r.autor_email})</p>
            <p><strong>Token Emitido (iat):</strong> ${iat}</p>
            <p><strong>Token Caduca (exp):</strong> ${exp}</p>
            <p class="token-wrap"><strong>Token:</strong> ${r.datos_token?.token_raw || ''}</p>
            ${imgsHtml}
        `;
        section.scrollIntoView({behavior:"smooth"});
        
    } catch(e) { console.error(e); }
}

function initCreateReview() {
    const form = document.getElementById('create-review-form');
    const imgInput = document.getElementById('imagen-input');
    const previewContainer = document.getElementById('image-preview');

    // 1. Función para eliminar una imagen de la lista
    const removeFile = (index) => {
        selectedFiles.splice(index, 1); // Elimina el archivo del array usando su índice
        renderPreview(); // Vuelve a pintar la lista
    };

    // 2. Listener para nuevas selecciones
    imgInput.addEventListener('change', () => {
        if (imgInput.files.length > 0) {
            const newFiles = Array.from(imgInput.files);
            selectedFiles = [...selectedFiles, ...newFiles];
            renderPreview();
            imgInput.value = ""; 
        }
    });

    // 3. Función de renderizado actualizada con botón 'X'
    const renderPreview = () => {
        previewContainer.innerHTML = "";
        // Usamos el índice (idx) para saber qué borrar
        selectedFiles.forEach((file, idx) => {
            // Contenedor relativo para imagen y botón
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-item';

            // Imagen
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.title = file.name;

            // Botón de eliminar 'X'
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×'; // Símbolo de multiplicación como 'X'
            closeBtn.className = 'preview-remove-btn';
            closeBtn.type = 'button'; // Importante: evita que envíe el formulario
            // Al hacer click, llamamos a removeFile con el índice actual
            closeBtn.addEventListener('click', () => removeFile(idx));

            wrapper.appendChild(img);
            wrapper.appendChild(closeBtn);
            previewContainer.appendChild(wrapper);
        });
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('create-msg');
        msg.textContent = "Subiendo datos...";
        
        try {
            const imageUrls = [];

            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const fd = new FormData();
                    fd.append('title', document.getElementById('nombre-input').value);
                    fd.append('file', file);
                    
                    const resImg = await fetch(`${API_BASE}/images/`, { method: 'POST', body: fd });
                    if (!resImg.ok) throw new Error("Error subiendo imagen");
                    
                    const dataImg = await resImg.json();
                    const url = dataImg.url || dataImg.secure_url;
                    if(url) imageUrls.push(url);
                }
            }
            
            const payload = {
                nombre_establecimiento: document.getElementById('nombre-input').value,
                direccion_postal: document.getElementById('direccion-input').value,
                valoracion: parseInt(document.getElementById('valoracion-input').value),
                imagenes: imageUrls
            };
            
            const res = await fetch(`${API_BASE}/resenas/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(payload)
            });
            
            if(!res.ok) throw new Error("Error creando reseña (verifica dirección)");
            
            msg.textContent = "¡Creada con éxito!";
            form.reset();
            
            selectedFiles = [];
            renderPreview();
            
            loadReviews();
            
        } catch(err) {
            console.error(err);
            msg.textContent = "Error: " + err.message;
        }
    });
}
