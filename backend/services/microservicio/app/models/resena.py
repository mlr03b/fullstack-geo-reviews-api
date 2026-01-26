from typing import List, Optional
from pydantic import BaseModel, EmailStr

class Coordenadas(BaseModel):
    latitud: float
    longitud: float

class DatosToken(BaseModel):
    token_raw: str
    iat: float
    exp: float

class Resena(BaseModel):
    # Datos introducidos por usuario
    nombre_establecimiento: str
    direccion_postal: str
    valoracion: int
    imagenes: List[str] = []

    # Datos autogenerados por backend
    coordenadas: Optional[dict] = None  # GeoJSON
    autor_email: Optional[EmailStr] = None
    autor_nombre: Optional[str] = None
    datos_token: Optional[DatosToken] = None