import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Layout/Header';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Failed to log in');
    }
    
    setLoading(false);
  };

  return (
    <div>
      <Header />
      <div className="container">
        <div className="form-container">
          <h2 className="text-center">Log In</h2>
          {error && <div style={{color: 'var(--error)'}}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <button 
              disabled={loading} 
              className="btn btn-primary" 
              type="submit"
              style={{width: '100%'}}
            >
              Log In
            </button>
          </form>
          <div className="text-center mt-2">
            Need an account? <Link to="/register" className="link">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;