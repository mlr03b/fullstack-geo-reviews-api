from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import logging
import cloudinary.uploader
from app.db import images
from dotenv import load_dotenv
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/")
async def upload_image(title: str = Form(...), file: UploadFile = File(...)):
    content = await file.read()

    try:
        response = cloudinary.uploader.upload(content)
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Error uploading image")
    
    image_url = response.get("secure_url")
    public_id = response.get("public_id")

    if not image_url:
        raise HTTPException(status_code=500, detail="Failed to retrieve image URL")
    
    image_data = {
        "title": title,
        "url": image_url,
        "public_id": public_id,
        "timestamp": datetime.now()
    }

    images.insert_one(image_data)

    created_image = images.find_one({"public_id": public_id})
    created_image["_id"] = str(created_image["_id"])
    return created_image
    
