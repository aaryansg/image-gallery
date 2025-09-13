from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from . import models, schemas, auth
from .database import SessionLocal, engine, get_db

# Import the images router correctly
from .images import router as images_router

app = FastAPI(title="Image Gallery API", version="0.1.0")




models.Base.metadata.create_all(bind=engine)



# Get frontend URL from environment variable or use default
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

# CORS middleware - UPDATED CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.get("/")
def read_root():
    return {"message": "Image Gallery API"}

@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = auth.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return auth.create_user(db=db, user=user)

@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    return auth.authenticate_user(db, user.email, user.password)

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(auth.get_current_user)):
    return current_user

# Make sure this line is at the end and uses the correct router variable
app.include_router(images_router, prefix="/api", tags=["images"])

if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("PRODUCTION"):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    
    # Correct path for Docker container - use ./ NOT ../
    build_path = "/app/frontend/build"
    
    # Debug: Check what directories exist
    print(f"Current working directory: {os.getcwd()}")
    print(f"Checking if build path exists: {build_path}")
    if os.path.exists(build_path):
        print(f"Build directory contents: {os.listdir(build_path)}")
        static_path = f"{build_path}/static"
        if os.path.exists(static_path):
            app.mount("/static", StaticFiles(directory=static_path), name="static")
        else:
            print(f"Static directory not found: {static_path}")
        
        # Serve index.html for all other routes
        @app.get("/{full_path:path}")
        async def serve_react_app(full_path: str):
            index_path = f"{build_path}/index.html"
            if os.path.exists(index_path):
                return FileResponse(index_path)
            return {"message": "React app not built yet"}
    else:
        print(f"Warning: React build directory not found at {build_path}")
        print(f"Current directory contents: {os.listdir('.')}")