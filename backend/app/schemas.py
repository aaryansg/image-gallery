# [file name]: schemas.py
# [file content begin]
from pydantic import BaseModel, EmailStr, Field
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
    like_count: int = 0
    is_liked: bool = False
    comment_count: int = 0

    class Config:
        from_attributes = True

class ImageUploadResponse(BaseModel):
    success: bool
    message: str
    image: Optional[Image] = None

class LikeBase(BaseModel):
    image_id: int

class LikeCreate(LikeBase):
    pass

class Like(LikeBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    image_id: int

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    user_id: int
    created_at: datetime
    user: User

    class Config:
        from_attributes = True

class PublicImage(Image):
    owner: Optional[User] = None
    comments: List[Comment] = []

    class Config:
        from_attributes = True
# [file content end]