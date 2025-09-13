# [file name]: models.py
# [file content begin]
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    role = Column(String, default="admin")  # Changed to admin by default
    
    # Relationship to images
    images = relationship("Image", back_populates="owner")
    # Relationships for likes and comments
    likes = relationship("Like", back_populates="user")
    comments = relationship("Comment", back_populates="user")

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    original_filename = Column(String)
    file_path = Column(String)  # This will store the S3 URL
    thumbnail_path = Column(String)  # This will store the S3 URL
    mime_type = Column(String)
    file_size = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    title = Column(String, nullable=True)
    caption = Column(Text, nullable=True)  # Fixed: Text is now imported
    alt_text = Column(String, nullable=True)
    exif_data = Column(JSON, nullable=True)
    privacy = Column(String, default="public")  # public, unlisted, private
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="images")
    likes = relationship("Like", back_populates="image", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="image", cascade="all, delete-orphan")

class Like(Base):
    __tablename__ = "likes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_id = Column(Integer, ForeignKey("images.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="likes")
    image = relationship("Image", back_populates="likes")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_id = Column(Integer, ForeignKey("images.id"))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="comments")
    image = relationship("Image", back_populates="comments")
# [file content end]