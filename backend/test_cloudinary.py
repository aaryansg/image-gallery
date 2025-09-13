import cloudinary
import cloudinary.uploader
from cloudinary import api
import os
from dotenv import load_dotenv

load_dotenv()

def test_cloudinary():
    print("🔧 Testing Cloudinary configuration...")
    
    # Check if environment variables are set
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    print(f"Cloud Name: {'✅ Set' if cloud_name else '❌ Missing'}")
    print(f"API Key: {'✅ Set' if api_key else '❌ Missing'}")
    print(f"API Secret: {'✅ Set' if api_secret else '❌ Missing'}")
    
    if not all([cloud_name, api_key, api_secret]):
        print("❌ Please set all Cloudinary credentials in your .env file")
        return False
    
    try:
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
        print("✅ Cloudinary configured successfully")
        
        # Test with a simple API call
        print("🧪 Testing Cloudinary API connection...")
        result = api.ping()
        print("✅ Cloudinary connection successful!")
        print("Response:", result)
        return True
        
    except Exception as e:
        print("❌ Cloudinary connection failed:")
        print(f"Error: {e}")
        print(f"Error type: {type(e).__name__}")
        return False

def test_upload():
    print("\n📤 Testing file upload...")
    try:
        # Upload a test image
        result = cloudinary.uploader.upload(
            "https://res.cloudinary.com/demo/image/upload/sample.jpg",
            public_id="test_upload"
        )
        print("✅ Test upload successful!")
        print("URL:", result['secure_url'])
        return True
    except Exception as e:
        print("❌ Test upload failed:")
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if test_cloudinary():
        test_upload()
