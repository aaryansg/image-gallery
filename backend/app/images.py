# [file name]: images.py
# [file content begin]
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from PIL import Image as PILImage
import io
from typing import List
from . import models, schemas
from .database import get_db
from .auth import get_current_user
from .cloudinary_client import cloudinary_client
import requests
from io import BytesIO
import base64
from .config import settings
from huggingface_hub import InferenceClient
import time
# Make sure the router is defined at the top level
router = APIRouter()

# Helper function to add like and comment counts to image
def add_image_counts(image, current_user_id=None):
    """Add like_count, is_liked, and comment_count to image object"""
    image_dict = {c.name: getattr(image, c.name) for c in image.__table__.columns}
    
    # Add like count
    image_dict['like_count'] = len(image.likes)
    
    # Add is_liked status if user is provided
    if current_user_id:
        image_dict['is_liked'] = any(like.user_id == current_user_id for like in image.likes)
    else:
        image_dict['is_liked'] = False
        
    # Add comment count
    image_dict['comment_count'] = len(image.comments)
    
    # Add owner information if available
    if hasattr(image, 'owner') and image.owner:
        image_dict['owner'] = image.owner
    
    # Add comments if available
    if hasattr(image, 'comments') and image.comments:
        image_dict['comments'] = image.comments
    
    return image_dict

# Your endpoints here...
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
    
    # Add like and comment counts using our helper function
    images_with_counts = [add_image_counts(image, current_user.id) for image in images]
    
    return images_with_counts

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
        print(f"📤 Starting upload for user {current_user.id}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read file content
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        print(f"📁 File received: {file.filename}, size: {len(contents)} bytes")
        
        # Generate unique public IDs
        file_ext = os.path.splitext(file.filename)[1].lower()
        original_public_id = f"images/{uuid.uuid4()}{file_ext}"
        thumbnail_public_id = f"thumbnails/{uuid.uuid4()}"
        
        # Get image dimensions
        with PILImage.open(io.BytesIO(contents)) as img:
            width, height = img.size
            print(f"📐 Image dimensions: {width}x{height}")
            
            # Create thumbnail
            thumbnail_data = cloudinary_client.generate_thumbnail(contents)
            if not thumbnail_data:
                raise HTTPException(status_code=500, detail="Failed to generate thumbnail")
        
        # Upload original image to Cloudinary
        print("☁️ Uploading original to Cloudinary...")
        original_result = cloudinary_client.upload_image(
            io.BytesIO(contents).getvalue(),
            original_public_id
        )
        
        if not original_result:
            raise HTTPException(status_code=500, detail="Failed to upload original to Cloudinary")
        
        print(f"✅ Original uploaded: {original_result['secure_url']}")
        
        # Upload thumbnail to Cloudinary
        print("☁️ Uploading thumbnail to Cloudinary...")
        thumbnail_result = cloudinary_client.upload_image(
            thumbnail_data,
            thumbnail_public_id
        )
        
        if not thumbnail_result:
            # Try to delete the original if thumbnail fails
            cloudinary_client.delete_image(original_public_id)
            raise HTTPException(status_code=500, detail="Failed to upload thumbnail to Cloudinary")
        
        print(f"✅ Thumbnail uploaded: {thumbnail_result['secure_url']}")
        
        # Get URLs
        original_url = original_result['secure_url']
        thumbnail_url = thumbnail_result['secure_url']
        
        # Create database record
        db_image = models.Image(
            filename=original_public_id,
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
            privacy=privacy,
            uploaded_by=current_user.id
        )
        
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        
        print("💾 Database record created successfully")
        
        # Convert to dict with counts
        image_response = add_image_counts(db_image, current_user.id)
        
        return {
            "success": True,
            "message": "Image uploaded successfully to Cloudinary",
            "image": image_response
        }
        
    except HTTPException as he:
        print(f"❌ HTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        print(f"❌ Unexpected error in upload_image: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

@router.delete("/images/{image_id}")
def delete_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Delete an image and its thumbnail from Cloudinary and database
    """
    try:
        # Find the image
        image = db.query(models.Image).filter(
            models.Image.id == image_id,
            models.Image.uploaded_by == current_user.id
        ).first()
        
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Delete from Cloudinary
        try:
            # Extract public_id from stored filename
            original_deleted = cloudinary_client.delete_image(image.filename)
            # For thumbnail, we need to reconstruct the public_id pattern
            # This assumes thumbnails are stored with the same public_id pattern
            # You might need to adjust this based on your naming convention
            thumbnail_public_id = image.filename.replace('images/', 'thumbnails/')
            thumbnail_deleted = cloudinary_client.delete_image(thumbnail_public_id)
            
            if not original_deleted or not thumbnail_deleted:
                print("⚠️ Warning: Could not delete images from Cloudinary")
        except Exception as cloudinary_error:
            print(f"⚠️ Cloudinary deletion error: {cloudinary_error}")
            # Continue with database deletion even if Cloudinary deletion fails
        
        # Delete from database
        db.delete(image)
        db.commit()
        
        return {"success": True, "message": "Image deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting image: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

# NEW ENDPOINTS FOR FEED, LIKES, AND COMMENTS
@router.get("/feed", response_model=List[schemas.PublicImage])
def get_public_feed(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Get public images from all users"""
    images = db.query(models.Image).filter(
        models.Image.privacy == "public"
    ).options(
        joinedload(models.Image.owner),
        joinedload(models.Image.comments).joinedload(models.Comment.user)
    ).offset(skip).limit(limit).all()
    
    # Convert to dict with counts using our helper function
    images_with_counts = [add_image_counts(image, current_user.id) for image in images]
    
    return images_with_counts

@router.post("/images/{image_id}/like")
def toggle_like(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Like or unlike an image"""
    image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Check if user already liked this image
    existing_like = db.query(models.Like).filter(
        models.Like.user_id == current_user.id,
        models.Like.image_id == image_id
    ).first()
    
    if existing_like:
        # Unlike the image
        db.delete(existing_like)
        db.commit()
        return {"success": True, "liked": False}
    else:
        # Like the image
        new_like = models.Like(user_id=current_user.id, image_id=image_id)
        db.add(new_like)
        db.commit()
        return {"success": True, "liked": True}

@router.post("/images/{image_id}/comment", response_model=schemas.Comment)
def add_comment(
    image_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Add a comment to an image"""
    image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Validate comment content
    if not comment.content or not comment.content.strip():
        raise HTTPException(status_code=400, detail="Comment content cannot be empty")
    
    new_comment = models.Comment(
        user_id=current_user.id,
        image_id=image_id,
        content=comment.content.strip()
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Load user information for the response
    new_comment.user = current_user
    
    return new_comment

# [file name]: images.py
# Replace the problematic text_to_image code with this:

# [file name]: images.py
# Add these imports at the top
from huggingface_hub import InferenceClient
from io import BytesIO
import os

@router.post("/generate-ai-image", response_model=schemas.ImageUploadResponse)
async def generate_ai_image(
    prompt: str = Form(...),
    negative_prompt: str = Form(None),
    title: str = Form(None),
    caption: str = Form(None),
    privacy: str = Form("private"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Generate an AI image using Nebius provider with FLUX.1-dev model
    """
    try:
        print(f"🎨 Starting AI image generation for user {current_user.id}")
        print(f"📝 Prompt: {prompt}")
        
        # Check if token is configured
        if not hasattr(settings, 'HUGGING_FACE_TOKEN') or not settings.HUGGING_FACE_TOKEN:
            print("❌ HUGGING_FACE_TOKEN not configured")
            raise HTTPException(status_code=500, detail="AI service not configured. Please contact administrator.")
        
        # Initialize the Inference Client with Nebius provider
        client = InferenceClient(
            provider="nebius",
            api_key=settings.HUGGING_FACE_TOKEN,
        )
        
        print("🌐 Calling Nebius Inference API with FLUX.1-dev...")
        
        # Generate the image using FLUX.1-dev model
        image = client.text_to_image(
            prompt,
            model="black-forest-labs/FLUX.1-dev",
            negative_prompt=negative_prompt
        )
        
        # Convert PIL Image to bytes
        img_byte_arr = BytesIO()
        image.save(img_byte_arr, format='PNG')
        image_data = img_byte_arr.getvalue()
        
        # Verify we got an actual image
        if not image_data or len(image_data) == 0:
            raise HTTPException(status_code=500, detail="AI service returned empty image")
        
        # Get image dimensions from the PIL Image
        width, height = image.size
        print(f"📐 Image dimensions: {width}x{height}")
        
        # Generate unique filenames
        file_ext = ".png"
        original_public_id = f"ai-images/{uuid.uuid4()}{file_ext}"
        thumbnail_public_id = f"ai-thumbnails/{uuid.uuid4()}"
        
        # Create thumbnail using your existing cloudinary_client
        thumbnail_data = cloudinary_client.generate_thumbnail(image_data)
        if not thumbnail_data:
            raise HTTPException(status_code=500, detail="Failed to generate thumbnail")
        
        # Upload original to Cloudinary
        print("☁️ Uploading original to Cloudinary...")
        original_result = cloudinary_client.upload_image(
            image_data,
            original_public_id
        )
        
        if not original_result:
            raise HTTPException(status_code=500, detail="Failed to upload image to cloud storage")
        
        # Upload thumbnail to Cloudinary
        print("☁️ Uploading thumbnail to Cloudinary...")
        thumbnail_result = cloudinary_client.upload_image(
            thumbnail_data,
            thumbnail_public_id
        )
        
        if not thumbnail_result:
            # Clean up the original if thumbnail fails
            cloudinary_client.delete_image(original_public_id)
            raise HTTPException(status_code=500, detail="Failed to upload thumbnail to cloud storage")
        
        # Create database record
        db_image = models.Image(
            filename=original_public_id,
            original_filename=f"ai-generated-{uuid.uuid4()}{file_ext}",
            file_path=original_result['secure_url'],
            thumbnail_path=thumbnail_result['secure_url'],
            mime_type="image/png",
            file_size=len(image_data),
            width=width,
            height=height,
            title=title or f"AI Generated: {prompt[:50]}...",
            caption=caption or f"Generated from prompt: {prompt}",
            alt_text=f"AI generated image based on prompt: {prompt}",
            privacy=privacy,
            uploaded_by=current_user.id
        )
        
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        
        # Add counts using your existing helper function
        image_response = add_image_counts(db_image, current_user.id)
        
        print("✅ AI image generated and saved successfully!")
        
        return {
            "success": True,
            "message": "AI image generated and saved to your gallery",
            "image": image_response
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error in AI image generation: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Provide specific error messages
        if "authentication" in str(e).lower() or "token" in str(e).lower():
            raise HTTPException(status_code=401, detail="AI service authentication failed. Please check your API token.")
        elif "timeout" in str(e).lower():
            raise HTTPException(status_code=504, detail="AI generation timed out. Please try again.")
        elif "model" in str(e).lower() or "flux" in str(e).lower():
            raise HTTPException(status_code=404, detail="AI model not available. Please try again later.")
        else:
            raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
# [file content end]