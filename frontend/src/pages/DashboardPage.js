import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Remove Link import
import Header from '../components/Layout/Header';
import ImageUpload from '../components/ImageUpload';
import axios from 'axios';

const DashboardPage = () => {
  const { currentUser, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);

  const fetchImages = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/images');
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
      if (error.response?.status === 401) {
        // Token expired, logout
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchImages();
    }
  }, [currentUser]);

  const handleUploadSuccess = () => {
    fetchImages(); // Refresh images after upload
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <div>
      <Header />
      <div className="container dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome, {currentUser?.full_name}! (Role: {currentUser?.role})</p>
          {/* REMOVE THE VIEW GALLERY BUTTON FROM HERE */}
        </div>

        <ImageUpload onUploadSuccess={handleUploadSuccess} />

        <div className="images-section">
          <h2>Your Images (Stored in AWS S3)</h2>
          {loading ? (
            <p>Loading images...</p>
          ) : images.length === 0 ? (
            <p>No images uploaded yet. Upload your first image!</p>
          ) : (
            <div className="images-grid">
              {images.map((image) => (
                <div key={image.id} className="image-card">
                  <img 
                    src={image.thumbnail_path}
                    alt={image.alt_text || image.title}
                    className="image-thumbnail"
                    onError={(e) => {
                      // Fallback to original image if thumbnail fails
                      e.target.src = image.file_path;
                    }}
                  />
                  <div className="image-info">
                    <div className="image-title">{image.title}</div>
                    <div className="image-meta">
                      {image.width}x{image.height} • {Math.round(image.file_size / 1024)}KB
                    </div>
                    <div className="image-meta">
                      <small>Stored in AWS S3</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={logout} className="btn btn-primary mt-2">
          Logout
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;