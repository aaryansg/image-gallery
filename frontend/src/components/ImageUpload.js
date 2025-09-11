import React, { useState, useRef } from 'react';
import axios from 'axios';

const ImageUpload = ({ onUploadSuccess }) => {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageData, setImageData] = useState({
    title: '',
    caption: '',
    alt_text: '',
    privacy: 'public'
  });
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      
      // Set default title from filename
      const filename = file.name.split('.')[0];
      setImageData(prev => ({
        ...prev,
        title: filename,
        alt_text: filename
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setImageData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpload = async () => {
  if (!selectedFile) return;

  setUploading(true);
  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('title', imageData.title || '');
  formData.append('caption', imageData.caption || '');
  formData.append('alt_text', imageData.alt_text || '');
  formData.append('privacy', imageData.privacy);

  try {
    const response = await axios.post('http://localhost:8000/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      alert('Image uploaded successfully!');
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageData({
        title: '',
        caption: '',
        alt_text: '',
        privacy: 'public'
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } else {
      alert('Upload failed: ' + response.data.message);
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.response?.status === 401) {
      alert('Session expired. Please login again.');
      // You might want to redirect to login here or trigger logout
    } else if (error.response?.data?.detail) {
      alert('Error uploading image: ' + error.response.data.detail);
    } else if (error.message) {
      alert('Error uploading image: ' + error.message);
    } else {
      alert('Error uploading image. Please try again.');
    }
  } finally {
    setUploading(false);
  }
};
  return (
    <div className="upload-section">
      <h3>Upload Image</h3>
      
      <div
        className={`upload-area ${dragging ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />
        
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="upload-preview" />
        ) : (
          <div>
            <p>Drag & drop an image here or click to browse</p>
            <p>Supports: JPEG, PNG, WEBP, GIF</p>
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="image-editor">
          <h4>Image Details</h4>
          
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={imageData.title}
              onChange={handleInputChange}
              placeholder="Image title"
            />
          </div>

          <div className="form-group">
            <label>Caption</label>
            <textarea
              name="caption"
              value={imageData.caption}
              onChange={handleInputChange}
              placeholder="Image description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Alt Text</label>
            <input
              type="text"
              name="alt_text"
              value={imageData.alt_text}
              onChange={handleInputChange}
              placeholder="Alternative text for accessibility"
            />
          </div>

          <div className="form-group">
            <label>Privacy</label>
            <select
              name="privacy"
              value={imageData.privacy}
              onChange={handleInputChange}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>

          <button 
            onClick={handleUpload} 
            disabled={uploading}
            className="btn btn-primary"
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;