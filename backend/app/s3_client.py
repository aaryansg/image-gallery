import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from .config import settings
import io
from PIL import Image

class S3Client:
    def __init__(self):
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
                endpoint_url=settings.AWS_S3_ENDPOINT
            )
            self.bucket_name = settings.AWS_S3_BUCKET
            
            # Test connection
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            print("✅ Successfully connected to S3 bucket")
            
        except Exception as e:
            print(f"❌ Failed to initialize S3 client: {e}")
            raise

    def upload_file(self, file_data, file_name, content_type):
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_name,
                Body=file_data,
                ContentType=content_type
            )
            print(f"✅ Successfully uploaded {file_name} to S3")
            return True
        except (NoCredentialsError, ClientError) as e:
            print(f"❌ Error uploading to S3: {e}")
            return False

    def generate_presigned_url(self, file_name, expiration=3600):
        """Generate a presigned URL for private files"""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_name},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            print(f"❌ Error generating presigned URL: {e}")
            return None

    def get_file_url(self, file_name):
        """Get public URL for public files"""
        if settings.AWS_S3_ENDPOINT:
            # For custom endpoints like DigitalOcean Spaces
            return f"{settings.AWS_S3_ENDPOINT}/{self.bucket_name}/{file_name}"
        else:
            # For AWS S3
            return f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{file_name}"

    def generate_thumbnail(self, image_data, size=(300, 300)):
        """Generate thumbnail from image data"""
        try:
            with Image.open(io.BytesIO(image_data)) as img:
                img.thumbnail(size)
                thumb_buffer = io.BytesIO()
                
                # Convert to appropriate format
                if img.mode in ('RGBA', 'LA'):
                    img = img.convert('RGB')
                
                img.save(thumb_buffer, format="WEBP" if img.mode != 'P' else "JPEG")
                thumb_buffer.seek(0)
                return thumb_buffer.getvalue()
        except Exception as e:
            print(f"❌ Error generating thumbnail: {e}")
            return None

# Create a singleton instance
s3_client = S3Client()