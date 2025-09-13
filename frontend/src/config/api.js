// src/config/api.js
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:8000';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return {
      'Content-Type': 'application/json'
    };
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const getAuthHeadersMultipart = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return {
      'Content-Type': 'multipart/form-data'
    };
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  };
};