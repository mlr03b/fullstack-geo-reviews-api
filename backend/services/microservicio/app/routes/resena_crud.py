from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, Header, Depends
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.db import resenas
from app.models.resena import Resena
import httpx
import jwt
from bson.errors import InvalidId

router = APIRouter()

def get_token_header(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")
    return authorization.split(" ")[1]

@router.get("/")
def obtener_resenas():
    # Listado con información resumida [cite: 16-19]
    lista = []
    for r in resenas.find():
        lista.append({
            "id": str(r["_id"]),
            "nombre_establecimiento": r["nombre_establecimiento"],
            "direccion_postal": r["direccion_postal"],
            "coordenadas": r.get("coordenadas", {}),
            "valoracion": r["valoracion"]
        })
    return jsonable_encoder(lista)

@router.get("/{resena_id}")
def obtener_detalle_resena(resena_id: str):
    # Detalle con información técnica del token e imágenes [cite: 20-25]
    try:
        r = resenas.find_one({"_id": ObjectId(resena_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID no válido")

    if not r:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")

    # Preparamos la respuesta completa
    return jsonable_encoder({
        "id": str(r["_id"]),
        "nombre_establecimiento": r["nombre_establecimiento"],
        "direccion_postal": r["direccion_postal"],
        "coordenadas": r.get("coordenadas", {}),
        "valoracion": r["valoracion"],
        "imagenes": r.get("imagenes", []),
        "autor_email": r.get("autor_email"),
        "autor_nombre": r.get("autor_nombre"),
        "datos_token": r.get("datos_token", {})
    })

@router.post("/")
def crear_resena(resena: Resena, token: str = Depends(get_token_header)):
    data = jsonable_encoder(resena)

    # 1. Procesar Token para acreditar autoría [cite: 27, 28]
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        data['autor_email'] = payload.get("email")
        data['autor_nombre'] = payload.get("name", "Usuario")
        data['datos_token'] = {
            "token_raw": token,
            "iat": payload.get("iat", 0),
            "exp": payload.get("exp", 0)
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Error leyendo token: {e}")

    # 2. Geocoding [cite: 33]
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={resena.direccion_postal}&format=json"
        resp = httpx.get(url)
        if resp.status_code == 200 and resp.json():
            geo = resp.json()[0]
            data['coordenadas'] = {
                "type": "Point",
                "coordinates": [float(geo['lon']), float(geo['lat'])] # [lon, lat] para Mongo
            }
        else:
            # Si no encuentra dirección, se podría lanzar error o guardar sin coords.
            # El requisito implica que se deben obtener. Lanzamos error si falla.
            raise HTTPException(status_code=400, detail="Dirección no encontrada para geocoding")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fallo Geocoding: {e}")

    new_id = resenas.insert_one(data).inserted_id
    return JSONResponse(status_code=status.HTTP_201_CREATED, content={"id": str(new_id)})