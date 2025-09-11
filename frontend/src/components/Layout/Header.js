import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { currentUser, logout } = useAuth();

  return (
    <header style={{
      padding: '1rem 0',
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--bg-tertiary)'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{
            color: 'var(--accent)',
            textDecoration: 'none',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            Image Gallery
          </Link>
          
          <nav>
            {currentUser ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <Link to="/dashboard" className="link">Dashboard</Link>
                <button onClick={logout} className="btn btn-primary">Logout</button>
              </div>
            ) : (
              <div style={{display: 'flex', gap: '1rem'}}>
                <Link to="/login" className="link">Login</Link>
                <Link to="/register" className="link">Register</Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;