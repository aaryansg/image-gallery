// [file name]: FeedPage.js
// [file content begin]
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import axios from 'axios';
import './FeedPage.css';
import { API_BASE_URL, getAuthHeaders } from '../config/api';

const FeedPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [publicImages, setPublicImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState({});
  const [expandedImage, setExpandedImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);

  const fetchPublicImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/feed`, { // Updated
        headers: getAuthHeaders() // Use the helper function
      });
      setPublicImages(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching public images:', error);
      setError('Failed to load public images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPublicImages();
    }
  }, [currentUser]);

  const handleLike = async (imageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/images/${imageId}/like`, {}, { // Updated
        headers: getAuthHeaders() // Use the helper function
      });
      
      if (response.data.success) {
        // Update the like status in the UI
        setPublicImages(prev => prev.map(image => {
          if (image.id === imageId) {
            return {
              ...image,
              is_liked: response.data.liked,
              like_count: response.data.liked ? image.like_count + 1 : image.like_count - 1
            };
          }
          return image;
        }));
      }
    } catch (error) {
      console.error('Error liking image:', error);
      setError('Failed to like image');
    }
  };

  const handleComment = async (imageId) => {
    const commentContent = commentText[imageId] || '';
    if (!commentContent.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/images/${imageId}/comment`, { // Updated
        content: commentContent
      }, {
        headers: getAuthHeaders() // Use the helper function
      });
      
      if (response.data) {
        // Add the new comment to the UI
        setPublicImages(prev => prev.map(image => {
          if (image.id === imageId) {
            const updatedComments = [...(image.comments || []), response.data];
            return {
              ...image,
              comments: updatedComments,
              comment_count: updatedComments.length
            };
          }
          return image;
        }));
        
        // Clear the comment input
        setCommentText(prev => ({ ...prev, [imageId]: '' }));
        setError('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      if (error.response?.status === 400) {
        setError(error.response.data.detail || 'Invalid comment');
      } else if (error.response?.status === 422) {
        setError('Validation error. Please check your comment content.');
      } else {
        setError('Error posting comment. Please try again.');
      }
    }
  };

  const toggleExpandImage = (imageId) => {
    if (expandedImage === imageId) {
      setExpandedImage(null);
    } else {
      setExpandedImage(imageId);
    }
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
      <div className="container feed-container">
        <div className="feed-header">
          <h1>Public Feed</h1>
          <p>Discover and engage with images shared by the community</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} style={{marginLeft: '10px'}}>
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading public images...</div>
        ) : publicImages.length === 0 ? (
          <div className="no-images">
            <p>No public images available yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="feed-grid">
            {publicImages.map((image) => (
              <div key={image.id} className="feed-card">
                <div className="feed-card-header">
                  <div className="user-info">
                    <span className="user-avatar">👤</span>
                    <span className="user-name">{image.owner?.full_name || 'Unknown User'}</span>
                  </div>
                  <span className="post-time">
                    {new Date(image.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div 
                  className={`feed-image-container ${expandedImage === image.id ? 'expanded' : ''}`}
                  onClick={() => toggleExpandImage(image.id)}
                >
                  <img 
                    src={image.file_path} 
                    alt={image.alt_text || image.title || image.original_filename}
                    className="feed-image"
                  />
                  {expandedImage !== image.id && (
                    <div className="image-overlay">
                      <span className="view-full">Click to view full image</span>
                    </div>
                  )}
                </div>
                
                <div className="feed-card-content">
                  {image.title && <h3 className="image-title">{image.title}</h3>}
                  {image.caption && <p className="image-caption">{image.caption}</p>}
                  
                  <div className="engagement-stats">
                    <span className="likes-count">{image.like_count || 0} likes</span>
                    <span className="comments-count">{image.comment_count || 0} comments</span>
                  </div>
                  
                  <div className="engagement-actions">
                    <button 
                      className={`like-btn ${image.is_liked ? 'liked' : ''}`}
                      onClick={() => handleLike(image.id)}
                    >
                      {image.is_liked ? '❤️ Liked' : '🤍 Like'}
                    </button>
                    
                    <button 
                      className="comment-btn"
                      onClick={() => document.getElementById(`comment-input-${image.id}`)?.focus()}
                    >
                      💬 Comment
                    </button>
                  </div>
                  
                  <div className="comments-section">
                    {image.comments && image.comments.slice(0, 3).map((comment) => (
                      <div key={comment.id} className="comment">
                        <strong>{comment.user?.full_name || 'Unknown User'}:</strong> {comment.content}
                      </div>
                    ))}
                    
                    {image.comments && image.comments.length > 3 && (
                      <div className="view-more-comments">
                        View {image.comments.length - 3} more comments
                      </div>
                    )}
                    
                    <div className="comment-input">
                      <input
                        id={`comment-input-${image.id}`}
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText[image.id] || ''}
                        onChange={(e) => setCommentText(prev => ({ 
                          ...prev, 
                          [image.id]: e.target.value 
                        }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleComment(image.id);
                          }
                        }}
                        maxLength={500}
                      />
                      <button 
                        onClick={() => handleComment(image.id)}
                        disabled={!commentText[image.id] || !commentText[image.id].trim()}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
// [file content end]