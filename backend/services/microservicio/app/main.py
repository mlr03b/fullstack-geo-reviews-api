import os
import cloudinary
from dotenv import load_dotenv
from fastapi import FastAPI
from app.routes import resena_crud, images_router
from fastapi.middleware.cors import CORSMiddleware

load_dotenv() 

# CONFIGURACIÓN CLOUDINARY
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

app = FastAPI()

origins = [
    "http://localhost:5500", # (Para local)
    "https://segundo-parcial-iw-2025.vercel.app", #(Para Vercel)
    "https://segundo-parcial-iw-2025.onrender.com" #(Para Render)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir todo para evitar problemas en examen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas actualizadas para ReViews
app.include_router(resena_crud.router, prefix="/resenas")
app.include_router(images_router.router, prefix="/images")
