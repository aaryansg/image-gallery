import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Layout/Header';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setError('');
      setLoading(true);
      const result = await register({
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password
      });
      
      if (result.success) {
        navigate('/login');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Failed to create an account');
    }
    
    setLoading(false);
  };

  return (
    <div>
      <Header />
      <div className="container">
        <div className="form-container">
          <h2 className="text-center">Sign Up</h2>
          {error && <div style={{color: 'var(--error)'}}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required 
              />
            </div>
            <button 
              disabled={loading} 
              className="btn btn-primary" 
              type="submit"
              style={{width: '100%'}}
            >
              Sign Up
            </button>
          </form>
          <div className="text-center mt-2">
            Already have an account? <Link to="/login" className="link">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;