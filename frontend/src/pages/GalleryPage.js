import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import axios from 'axios';
import './GalleryPage.css';

const GalleryPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, title, caption, camera
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/images', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setImages(response.data);
      setFilteredImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images');
      if (error.response?.status === 401) {
        navigate('/login');
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
        // Search by camera model using the search endpoint
        response = await axios.get(`http://localhost:8000/api/images/search?camera_model=${encodeURIComponent(searchTerm)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else if (searchType === 'all') {
        // Search using the general search endpoint
        response = await axios.get(`http://localhost:8000/api/images/search?keyword=${encodeURIComponent(searchTerm)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Filter locally for other search types
        const filtered = images.filter(image => {
          const searchLower = searchTerm.toLowerCase();
          switch (searchType) {
            case 'title':
              return image.title?.toLowerCase().includes(searchLower);
            case 'caption':
              return image.caption?.toLowerCase().includes(searchLower);
            case 'filename':
              return image.original_filename?.toLowerCase().includes(searchLower);
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
          <h1>Image Gallery</h1>
          <p>Browse and search through your uploaded images</p>
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
          </div>
        )}

        {loading ? (
          <div className="loading">Loading images...</div>
        ) : (
          <>
            <div className="results-info">
              Showing {filteredImages.length} of {images.length} images
              {searchTerm && (
                <span> for "{searchTerm}"</span>
              )}
            </div>

            {filteredImages.length === 0 ? (
              <div className="no-results">
                {searchTerm ? 'No images found matching your search.' : 'No images uploaded yet.'}
              </div>
            ) : (
              <div className="gallery-grid">
                {filteredImages.map((image) => (
                  <div key={image.id} className="gallery-card">
                    <img 
                      src={image.thumbnail_path || image.file_path}
                      alt={image.alt_text || image.title || image.original_filename}
                      className="gallery-image"
                      onError={(e) => {
                        e.target.src = image.file_path;
                      }}
                    />
                    <div className="gallery-card-info">
                      <h4 className="image-title">
                        {image.title || image.original_filename}
                      </h4>
                      {image.caption && (
                        <p className="image-caption">{image.caption}</p>
                      )}
                      <div className="image-meta">
                        <span>{image.width}x{image.height}</span>
                        <span>{Math.round(image.file_size / 1024)}KB</span>
                        {image.exif_data && image.exif_data['EXIF Model'] && (
                          <span className="camera-model">
                            📷 {image.exif_data['EXIF Model']}
                          </span>
                        )}
                      </div>
                      {image.exif_data && (
                        <div className="exif-preview">
                          <small>
                            {image.exif_data['EXIF DateTimeOriginal'] && 
                              new Date(image.exif_data['EXIF DateTimeOriginal'].replace(':', '-').replace(':', '-')).toLocaleDateString()
                            }
                            {image.exif_data['EXIF FNumber'] && ` • f/${image.exif_data['EXIF FNumber']}`}
                            {image.exif_data['EXIF ExposureTime'] && ` • ${image.exif_data['EXIF ExposureTime']}s`}
                            {image.exif_data['EXIF ISOSpeedRatings'] && ` • ISO ${image.exif_data['EXIF ISOSpeedRatings']}`}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;