import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import ImageUpload from '../components/ImageUpload';
import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../config/api';

const DashboardPage = () => {
  const { currentUser, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/images`, { // Updated
        headers: getAuthHeaders() // Use the helper function
      });

      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
      if (error.response?.status === 401) {
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

  const deleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    setDeleting(prev => ({ ...prev, [imageId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/api/images/${imageId}`, { // Updated
        headers: getAuthHeaders() // Use the helper function
      });
      
      if (response.data.success) {
        setImages(prev => prev.filter(img => img.id !== imageId));
      }
      
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    } finally {
      setDeleting(prev => ({ ...prev, [imageId]: false }));
    }
  };

  const handleUploadSuccess = () => {
    fetchImages();
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div>
      <Header />
      <div className="container dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome, {currentUser?.full_name}! (Role: {currentUser?.role})</p>
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
                      e.target.src = image.file_path;
                    }}
                  />
                  <div className="image-info">
                    <div className="image-title">{image.title || image.original_filename}</div>
                    <div className="image-meta">
                      {image.width}x{image.height} • {Math.round(image.file_size / 1024)}KB
                    </div>
                    <div className="image-meta">
                      <small>Stored in AWS S3</small>
                    </div>
                    <button
                      onClick={() => deleteImage(image.id)}
                      disabled={deleting[image.id]}
                      className="btn"
                      style={{
                        marginTop: '0.5rem',
                        background: 'var(--error)',
                        color: 'white',
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        width: '100%'
                      }}
                    >
                      {deleting[image.id] ? 'Deleting...' : '🗑️ Delete Image'}
                    </button>
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