import React, { useState } from 'react';
import { loginUser, registerUser, getNonce } from '../utils/api';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
    specializations: []
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSpecializationChange = (e) => {
    const value = e.target.value;
    setFormData(prev => {
      const sp = prev.specializations.includes(value)
        ? prev.specializations.filter(s => s !== value)
        : [...prev.specializations, value];
      return { ...prev, specializations: sp };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install it to use this app.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];

      let data;
      if (isRegister) {
        const registerData = {
          ...formData,
          walletAddress
        };
        data = await registerUser(registerData);
      } else {
        const { nonce } = await getNonce(walletAddress);

        const message = `Please sign this message to login to the Decentralized Incident Reporting System.\n\nNonce: ${nonce}`;
        const hexMessage = "0x" + Array.from(message).map(c => 
          c.charCodeAt(0) < 128 ? c.charCodeAt(0).toString(16).padStart(2, '0') : encodeURIComponent(c).replace(/\%/g,'').toLowerCase()
        ).join('');

        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [hexMessage, walletAddress],
        });

        data = await loginUser({ 
          username: formData.username, 
          password: formData.password,
          walletAddress,
          signature
        });
      }
      
      // Save token and user basic info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      onLoginSuccess(data.user);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username (Pseudo-anonymous ID):</label>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          {isRegister && (
            <div className="form-group">
              <label>Role:</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="user">User / Whistleblower</option>
                <option value="investigator">Investigator / Admin</option>
              </select>
            </div>
          )}

          {isRegister && formData.role === 'investigator' && (
            <div className="form-group">
              <label>Specializations (Select at least one):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                {['Cybercrime', 'Corruption', 'Public Disturbance', 'Illegal Activity', 'Harrasment', 'Others'].map(cat => (
                  <label key={cat} style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 'normal', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      value={cat}
                      checked={formData.specializations.includes(cat)}
                      onChange={handleSpecializationChange}
                      style={{ marginRight: '8px', width: 'auto' }}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <button type="submit" className="submit-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" style={{ width: '18px' }} />
            {isRegister ? 'Register with MetaMask' : 'Login with MetaMask'}
          </button>
        </form>
        
        <p className="toggle-mode" onClick={() => setIsRegister(!isRegister)} style={{ marginTop: '20px' }}>
          {isRegister ? 'Already have an account? Login here.' : 'Need an account? Register here.'}
        </p>
      </div>
    </div>
  );
};

export default Login;
