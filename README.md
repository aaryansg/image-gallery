# Image Gallery Application

A full-stack web application for uploading, managing, and generating images with AI capabilities. Built with React frontend, FastAPI backend, PostgreSQL database, and Cloudinary for image storage.

## 🌟 Features

- **Image Management**: Upload, organize, and manage your images
- **AI Image Generation**: Create images using AI with text prompts
- **User Authentication**: Secure login/registration system
- **Gallery View**: Browse and search through uploaded images
- **Social Features**: Like and comment on public images
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router
- Axios for API calls
- CSS3 with custom properties

### Backend
- FastAPI
- SQLAlchemy ORM
- PostgreSQL (Production) / SQLite (Development)
- JWT Authentication
- Cloudinary for image storage

### AI/ML
- Stable Diffusion for image generation
- Image processing with Pillow

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **PostgreSQL** (for production)
- **Cloudinary account** for image storage
- **Hugging Face account** for AI model access

## 🔧 Installation

### 1. Clone the Repository

bash
git clone <your-repository-url>
cd image-gallery-app
2. Backend Setup
bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
3. Frontend Setup
bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
4. Environment Variables
Create a .env file in the backend directory:

env
# Database
DATABASE_URL=sqlite:///./image_gallery.db

# JWT Authentication
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Hugging Face (for AI generation)
HUGGINGFACE_API_KEY=your-huggingface-api-key
🚀 Running the Application
Development Mode
Start the Backend:

bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Start the Frontend (in a new terminal):

bash
cd frontend
npm start
The application will be available at:

Frontend: http://localhost:3000

Backend API: http://localhost:8000

API Documentation: http://localhost:8000/docs

Production Deployment
This application is configured for deployment on Railway. To deploy:

Push to GitHub:

bash
git add .
git commit -m "Deploy ready"
git push origin main
Deploy on Railway:

bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up
Set environment variables in Railway dashboard.

🌐 Environment Variables
Required
SECRET_KEY: JWT secret key for authentication

CLOUDINARY_CLOUD_NAME: Cloudinary cloud name

CLOUDINARY_API_KEY: Cloudinary API key

CLOUDINARY_API_SECRET: Cloudinary API secret

DATABASE_URL: Database connection string (default: SQLite)

HUGGINGFACE_API_KEY: For AI image generation

FRONTEND_URL: Frontend URL for CORS (auto-detected)

