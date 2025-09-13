// [file name]: ImageUpload.js
// [file content begin]
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL, getAuthHeadersMultipart } from '../config/api';

const ImageUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [privacy, setPrivacy] = useState('public'); // Add privacy state
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      setSelectedFile(files[0]);
      setPreviewUrl(URL.createObjectURL(files[0]));
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);
    formData.append('caption', caption);
    formData.append('alt_text', altText);
    formData.append('privacy', privacy); // Add privacy to form data

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, { // Updated
        headers: getAuthHeadersMultipart(), // Use the multipart helper function
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        alert('Upload successful!');
        resetForm();
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setTitle('');
    setCaption('');
    setAltText('');
    setPrivacy('public'); // Reset privacy to public
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-section">
      <h3>Upload New Image</h3>
      
      <div
        className="upload-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="upload-preview" />
        ) : (
          <div>
            <p>📁 Drag & drop an image here or click to browse</p>
            <p><small>Supports JPG, PNG, WEBP, GIF</small></p>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="image-editor">
          <h4>Image Details</h4>
          
          <div className="form-group">
            <label>Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter image title"
            />
          </div>

          <div className="form-group">
            <label>Caption (optional)</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter image caption"
            />
          </div>

          <div className="form-group">
            <label>Alt Text (optional)</label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image for accessibility"
            />
          </div>

          {/* Privacy Settings */}
          <div className="form-group">
            <label>Privacy Settings</label>
            <select 
              value={privacy} 
              onChange={(e) => setPrivacy(e.target.value)}
              className="privacy-select"
            >
              <option value="public">Public (Visible to everyone)</option>
              <option value="unlisted">Unlisted (Only visible with link)</option>
              <option value="private">Private (Only visible to you)</option>
            </select>
          </div>

          <div className="editor-controls">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn btn-primary"
            >
              {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Image'}
            </button>
            
            <button
              type="button"
              onClick={resetForm}
              className="btn"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
          </div>

          {uploading && (
            <div style={{ marginTop: '1rem' }}>
              <progress value={uploadProgress} max="100" style={{ width: '100%' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
// [file content end]