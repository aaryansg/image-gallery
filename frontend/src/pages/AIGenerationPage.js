// [file name]: AIGenerationPage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import axios from 'axios';
import './AIGenerationPage.css';
import { API_BASE_URL, getAuthHeaders } from '../config/api';

const AIGenerationPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [title, setTitle] = useState(''); // Add title state
  const [caption, setCaption] = useState(''); // Add caption state
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  if (!authLoading && !currentUser) {
    navigate('/login');
    return null;
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedImage(null);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('prompt', prompt);
      if (negativePrompt) formData.append('negative_prompt', negativePrompt);
      formData.append('privacy', 'private');
      
      // Add optional fields - only if they have values
      if (title) formData.append('title', title);
      if (caption) formData.append('caption', caption);

      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:8000';

      const response = await axios.post(
        `${API_BASE_URL}/api/generate-ai-image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 120000 // 2 minutes timeout for AI generation
        }
      );

      if (response.data.success) {
        setGeneratedImage(response.data.image.file_path);
        // Clear the form after successful generation
        setPrompt('');
        setNegativePrompt('');
        setTitle('');
        setCaption('');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      
      // Better error handling
      if (error.response?.status === 503) {
        setError('AI model is loading. Please try again in 30-60 seconds.');
      } else if (error.response?.status === 401) {
        setError('Authentication error. Please log in again.');
      } else if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAnother = () => {
    setGeneratedImage(null);
    setPrompt('');
    setNegativePrompt('');
    setTitle('');
    setCaption('');
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Header />
      <div className="container ai-generation-container">
        <div className="ai-generation-header">
          <h1>AI Image Generation</h1>
          <p>Create unique images using AI with just a text prompt</p>
        </div>

        {!generatedImage ? (
          <div className="generation-form">
            <div className="form-group">
              <label>Prompt (describe what you want to see)*</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A beautiful sunset over mountains, digital art, highly detailed"
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Negative Prompt (what you don't want to see, optional)</label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="blurry, low quality, distorted faces"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My AI Generated Image"
              />
            </div>

            <div className="form-group">
              <label>Caption (optional)</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Description of this image..."
                rows="2"
              />
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={generating || !prompt.trim()}
              className="btn btn-primary generate-btn"
            >
              {generating ? 'Generating...' : 'Generate Image'}
            </button>

            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <div className="generation-result">
            <h2>🎉 Image Generated Successfully!</h2>
            <p>Your image has been automatically saved to your gallery.</p>
            <div className="result-image">
              <img src={generatedImage} alt={`AI generated from prompt: ${prompt}`} />
            </div>
            <div className="result-actions">
              <button onClick={handleGenerateAnother} className="btn btn-primary">
                Generate Another Image
              </button>
              <button 
                onClick={() => navigate('/gallery')} 
                className="btn"
              >
                View in Gallery
              </button>
            </div>
          </div>
        )}

        <div className="ai-tips">
          <h3>💡 Tips for better results:</h3>
          <ul>
            <li>Be specific with your descriptions</li>
            <li>Include art style (e.g., "digital art", "oil painting", "photorealistic")</li>
            <li>Mention colors, lighting, and composition</li>
            <li>Use negative prompts to exclude unwanted elements</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIGenerationPage;