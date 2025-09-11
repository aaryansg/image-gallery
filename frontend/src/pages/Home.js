import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Layout/Header';

const Home = () => {
  return (
    <div>
      <Header />
      <div className="home-container">
        <h1 className="home-title">Image Gallery</h1>
        <p className="home-subtitle">
          A modern, extensible media platform with AI capabilities, 
          advanced search, and beautiful themes.
        </p>
        
        <div className="home-buttons">
          <Link to="/login" className="btn btn-primary" style={{padding: '1rem 2rem'}}>
            Login
          </Link>
          <Link to="/register" className="btn btn-primary" style={{padding: '1rem 2rem', marginLeft: '1rem'}}>
            Register
          </Link>
        </div>

        <div style={{marginTop: '3rem', maxWidth: '800px'}}>
          <h2>Features</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '1.5rem'}}>
            <div style={{padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px'}}>
              <h3>📸 Image Management</h3>
              <p>Upload, organize, and manage your images with ease.</p>
            </div>
            <div style={{padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px'}}>
              <h3>🎨 AI Generation</h3>
              <p>Create stunning images with AI-powered generation tools.</p>
            </div>
            <div style={{padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px'}}>
              <h3>🔍 Smart Search</h3>
              <p>Find images using visual similarity and text search.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;