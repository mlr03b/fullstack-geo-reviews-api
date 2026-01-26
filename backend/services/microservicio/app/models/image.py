from pydantic import BaseModel

class ImageCreate(BaseModel):
    title: str