import cloudinary
import cloudinary.uploader
from cloudinary import api
from .config import settings
from PIL import Image
import io

class CloudinaryClient:
    def __init__(self):
        self.is_configured = False
        try:
            # Check if Cloudinary credentials are set
            if not all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
                print("❌ Cloudinary credentials not found in environment variables")
                print("   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET")
                return
            
            # Configure Cloudinary
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )
            
            # Test the configuration
            api.ping()
            self.is_configured = True
            print("✅ Cloudinary configured successfully")
            
        except Exception as e:
            print(f"❌ Failed to configure Cloudinary: {e}")
            self.is_configured = False

    def upload_image(self, file_data, public_id, folder=None):
        """Upload image to Cloudinary"""
        if not self.is_configured:
            print("❌ Cloudinary not configured - skipping upload")
            return None
            
        try:
            upload_params = {
                "public_id": public_id,
                "overwrite": True,
                "resource_type": "image"
            }
            
            if folder:
                upload_params["folder"] = folder
            
            # Upload the image
            result = cloudinary.uploader.upload(
                file_data,
                **upload_params
            )
            print(f"✅ Upload successful for {public_id}")
            return result
        except Exception as e:
            print(f"❌ Error uploading to Cloudinary: {e}")
            return None

    def generate_thumbnail(self, image_data, size=(300, 300)):
        """Generate thumbnail from image data"""
        try:
            with Image.open(io.BytesIO(image_data)) as img:
                img.thumbnail(size)
                thumb_buffer = io.BytesIO()
                
                # Convert to appropriate format
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                    img.save(thumb_buffer, format="JPEG", quality=85)
                else:
                    img.save(thumb_buffer, format="WEBP", quality=85)
                
                thumb_buffer.seek(0)
                return thumb_buffer.getvalue()
        except Exception as e:
            print(f"❌ Error generating thumbnail: {e}")
            return None

    def get_image_url(self, public_id, transformation=None):
        """Get image URL with optional transformations"""
        if not self.is_configured:
            return None
            
        try:
            from cloudinary import CloudinaryImage
            if transformation:
                return CloudinaryImage(public_id).build_url(transformation=transformation)
            else:
                return CloudinaryImage(public_id).build_url()
        except Exception as e:
            print(f"❌ Error generating image URL: {e}")
            return None

    def delete_image(self, public_id):
        """Delete image from Cloudinary"""
        if not self.is_configured:
            return False
            
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception as e:
            print(f"❌ Error deleting image from Cloudinary: {e}")
            return False

# Create a singleton instance
cloudinary_client = CloudinaryClient()
