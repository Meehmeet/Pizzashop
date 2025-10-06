import React, { useState } from 'react';
import adminApiService from '../services/adminApiService';

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await adminApiService.adminLogin(email, password);
      
      if (result.success) {
        onLogin();
      } else {
        setError(result.message || 'Login fehlgeschlagen');
      }
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="content-section" style={{ maxWidth: '400px', margin: '100px auto' }}>
        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '30px' }}>
          🍕 Admin Login
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-Mail:</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="root@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Passwort:</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ihr Admin-Passwort"
              required
            />
          </div>

          {error && (
            <div style={{ color: '#dc3545', marginBottom: '20px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Wird eingeloggt...' : 'Anmelden'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
          <p>Nur für Administratoren zugänglich</p>
          <p><strong>Demo:</strong> root@gmail.com / root1234!</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;