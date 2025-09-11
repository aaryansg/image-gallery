import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from PIL import Image as PILImage
import io
from typing import List
from . import models, schemas
from .database import get_db
from .auth import get_current_user
from .s3_client import s3_client
import exifread
import json

# Make sure the router is defined
router = APIRouter()

# This endpoint should be at /api/upload (because of the prefix)
@router.post("/upload", response_model=schemas.ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    title: str = Form(None),
    caption: str = Form(None),
    alt_text: str = Form(None),
    privacy: str = Form("public"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read file content
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # EXTRACT METADATA
        exif_data = {}
        try:
            # Reset file pointer for exifread
            file_buffer = io.BytesIO(contents)
            tags = exifread.process_file(file_buffer)
            
            # Convert EXIF data to JSON-serializable format
            for tag, value in tags.items():
                exif_data[tag] = str(value)
        except Exception as e:
            print(f"Could not extract EXIF data: {e}")
            # Continue even if EXIF extraction fails
        
        # Generate unique filenames
        file_ext = os.path.splitext(file.filename)[1].lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        thumbnail_filename = f"{uuid.uuid4()}.webp"
        
        # Get image dimensions and create thumbnail
        with PILImage.open(io.BytesIO(contents)) as img:
            width, height = img.size
            
            # Create thumbnail
            img.thumbnail((300, 300))
            thumb_buffer = io.BytesIO()
            
            # Handle different image modes
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
                img.save(thumb_buffer, format="JPEG")
            else:
                img.save(thumb_buffer, format="WEBP")
            
            thumb_buffer.seek(0)
            thumbnail_data = thumb_buffer.getvalue()
        
        # Upload original image to S3
        original_uploaded = s3_client.upload_file(
            io.BytesIO(contents).getvalue(),
            unique_filename,
            file.content_type
        )
        
        # Upload thumbnail to S3
        thumbnail_content_type = "image/jpeg" if img.mode == 'RGB' else "image/webp"
        thumbnail_uploaded = s3_client.upload_file(
            thumbnail_data,
            thumbnail_filename,
            thumbnail_content_type
        )
        
        if not original_uploaded or not thumbnail_uploaded:
            raise HTTPException(status_code=500, detail="Failed to upload to storage")
        
        # Get URLs
        original_url = s3_client.get_file_url(unique_filename)
        thumbnail_url = s3_client.get_file_url(thumbnail_filename)
        
        # Create database record - ADD EXIF_DATA HERE
        db_image = models.Image(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=original_url,
            thumbnail_path=thumbnail_url,
            mime_type=file.content_type,
            file_size=len(contents),
            width=width,
            height=height,
            title=title,
            caption=caption,
            alt_text=alt_text,
            exif_data=exif_data,  # Store extracted EXIF data
            privacy=privacy,
            uploaded_by=current_user.id
        )
        
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        
        return {
            "success": True,
            "message": "Image uploaded successfully to AWS S3",
            "image": db_image
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

# This endpoint should be at /api/images (because of the prefix)
@router.get("/images", response_model=List[schemas.Image])
def get_images(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    images = db.query(models.Image).filter(
        models.Image.uploaded_by == current_user.id
    ).offset(skip).limit(limit).all()
    return images

@router.get("/images/search", response_model=List[schemas.Image])
def search_images(
    keyword: str = None,
    camera_model: str = None,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Search images by EXIF data or other metadata
    """
    query = db.query(models.Image).filter(
        models.Image.uploaded_by == current_user.id
    )
    
    if keyword:
        query = query.filter(
            (models.Image.title.contains(keyword)) |
            (models.Image.caption.contains(keyword)) |
            (models.Image.alt_text.contains(keyword))
        )
    
    if camera_model:
        # Search in EXIF data for camera model
        query = query.filter(
            models.Image.exif_data.contains({"EXIF Model": camera_model})
        )
    
    images = query.all()
    return images

@router.get("/images/{image_id}/exif")
def get_image_exif(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Get EXIF data for a specific image
    """
    image = db.query(models.Image).filter(
        models.Image.id == image_id,
        models.Image.uploaded_by == current_user.id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return image.exif_data