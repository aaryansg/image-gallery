// [file name]: App.js
// [file content begin]
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GalleryPage from './pages/GalleryPage';
import FeedPage from './pages/FeedPage'; // Add this import
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App dark-theme">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/feed" element={<FeedPage />} /> {/* Add this route */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
// [file content end]