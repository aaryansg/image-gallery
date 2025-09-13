// [file name]: GalleryPage.js
// [file content begin]
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import ImageModal from '../components/ImageModal';
import axios from 'axios';
import './GalleryPage.css';
import { API_BASE_URL, getAuthHeaders, getAuthHeadersMultipart } from '../config/api';

const GalleryPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/images`, { // Updated
        headers: getAuthHeaders() // Use the helper function
      });
      setImages(response.data);
      setFilteredImages(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images');
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check if the server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const searchImages = async (searchTerm, searchType) => {
    if (!searchTerm.trim()) {
      setFilteredImages(images);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      let response;

      if (searchType === 'camera') {
        response = await axios.get(`${API_BASE_URL}/api/images/search?camera_model=${encodeURIComponent(searchTerm)}`, { // Updated
          headers: getAuthHeaders() // Use the helper function
        });
      } else if (searchType === 'all') {
        response = await axios.get(`${API_BASE_URL}/api/images/search?keyword=${encodeURIComponent(searchTerm)}`, { // Updated
          headers: getAuthHeaders() // Use the helper function
        });
      } else {
        const filtered = images.filter(image => {
          const searchLower = searchTerm.toLowerCase();
          switch (searchType) {
            case 'title':
              return image.title?.toLowerCase().includes(searchLower);
            case 'caption':
              return image.caption?.toLowerCase().includes(searchLower);
            case 'filename':
              return image.original_filename?.toLowerCase().includes(searchLower);
            case 'privacy':
              return image.privacy?.toLowerCase().includes(searchLower);
            default:
              return true;
          }
        });
        setFilteredImages(filtered);
        return;
      }

      setFilteredImages(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed');
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const handleSaveEdit = async (editedImageData) => {
    try {
      // Convert base64 to blob
      const response = await fetch(editedImageData.imageData);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', blob, editedImageData.filename);
      formData.append('title', selectedImage.title || '');
      formData.append('caption', selectedImage.caption || '');
      formData.append('alt_text', selectedImage.alt_text || '');
      formData.append('privacy', selectedImage.privacy || 'public');
      
      const token = localStorage.getItem('token');
      const uploadResponse = await axios.post(`${API_BASE_URL}/api/upload`, formData, { // Updated
        headers: getAuthHeadersMultipart() // Use the multipart helper function
      });
      
      if (uploadResponse.data.success) {
        alert('Image edited and saved successfully!');
        fetchImages(); // Refresh gallery
      }
    } catch (error) {
      console.error('Error saving edited image:', error);
      alert('Error saving edited image. Please try again.');
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchImages();
    }
  }, [currentUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    searchImages(searchTerm, searchType);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (!e.target.value.trim()) {
      setFilteredImages(images);
    }
  };

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
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
      <div className="container gallery-container">
        <div className="gallery-header">
          <div className="gallery-title">
            <h1>Image Gallery</h1>
            <p>Browse and search through your uploaded images</p>
          </div>
          
          <div className="view-mode-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => handleViewModeChange('grid')}
            >
              🟦 Grid
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => handleViewModeChange('list')}
            >
              🟰 List
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <select 
                value={searchType} 
                onChange={handleSearchTypeChange}
                className="search-type-select"
              >
                <option value="all">All Fields</option>
                <option value="title">Title</option>
                <option value="caption">Caption</option>
                <option value="filename">Filename</option>
                <option value="privacy">Privacy</option>
                <option value="camera">Camera Model</option>
              </select>
              <input
                type="text"
                placeholder={`Search by ${searchType}...`}
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              <button type="submit" className="btn btn-primary search-btn">
                Search
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={fetchImages} style={{marginLeft: '10px'}}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading images...</div>
        ) : (
          <>
            <div className="gallery-controls">
              <div className="results-info">
                Showing {filteredImages.length} of {images.length} images
                {searchTerm && (
                  <span> for "{searchTerm}"</span>
                )}
              </div>
              
              <div className="sort-controls">
                <select className="sort-select">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="size">File Size</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            {filteredImages.length === 0 ? (
              <div className="no-results">
                {searchTerm ? 'No images found matching your search.' : 'No images uploaded yet.'}
              </div>
            ) : (
              <div className={`gallery-content ${viewMode}`}>
                {filteredImages.map((image) => (
                  <div 
                    key={image.id} 
                    className={`gallery-item ${viewMode}`}
                    onClick={() => handleImageClick(image)}
                  >
                    <div className="image-container">
                      <img 
                        src={image.thumbnail_path || image.file_path}
                        alt={image.alt_text || image.title || image.original_filename}
                        className="gallery-image"
                        onError={(e) => {
                          e.target.src = image.file_path;
                        }}
                      />
                      <div className="image-overlay">
                        <div className="overlay-content">
                          <h4 className="image-title">
                            {image.title || image.original_filename}
                          </h4>
                          <div className="image-meta">
                            <span className="privacy-badge">{image.privacy}</span>
                            <span>{image.width}x{image.height}</span>
                            <span>{Math.round(image.file_size / 1024)}KB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {viewMode === 'list' && (
                      <div className="item-details">
                        <h4>{image.title || image.original_filename}</h4>
                        {image.caption && <p>{image.caption}</p>}
                        <div className="meta-info">
                          <span className="privacy">{image.privacy}</span>
                          <span>{new Date(image.uploaded_at).toLocaleDateString()}</span>
                          <span>{Math.round(image.file_size / 1024)}KB</span>
                        </div>
                        {image.exif_data && image.exif_data['EXIF Model'] && (
                          <div className="camera-info">
                            📷 {image.exif_data['EXIF Model']}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ImageModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default GalleryPage;
// [file content end]