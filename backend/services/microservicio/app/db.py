import os
from dotenv import load_dotenv
from pymongo import MongoClient, GEOSPHERE

load_dotenv() 

MONGO_URI = os.getenv("MONGO_URI")

mongo = MongoClient(MONGO_URI)
db = mongo.reviews_db  # Base de datos para ReViews

resenas = db.resenas
resenas.create_index({"coordenadas": "2dsphere"}) 
images = db.images






