from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ImageBase(BaseModel):
    title: Optional[str] = None
    caption: Optional[str] = None
    alt_text: Optional[str] = None
    privacy: str = "public"

class ImageCreate(ImageBase):
    original_filename: str
    mime_type: str
    file_size: int

class Image(ImageBase):
    id: int
    filename: str
    file_path: str
    thumbnail_path: str
    width: int
    height: int
    uploaded_by: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class ImageUploadResponse(BaseModel):
    success: bool
    message: str
    image: Optional[Image] = None