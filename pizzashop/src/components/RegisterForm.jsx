import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
// Frontend-Validierung für sofortiges User-Feedback (arbeitet mit Backend zusammen)
import { validateRegistration } from '../utils/validation';
import { ERROR_CODES, STATUS_CODES } from '../utils/errorcode';

const RegisterForm = ({ addPopup }) => {
  const [benutzername, setBenutzername] = useState('');
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Frontend-Validierung: Sofortige Prüfung OHNE Server-Anfrage
    // User bekommt schnelles Feedback, Backend macht später Sicherheitsprüfung
    const validation = validateRegistration({ 
      username: benutzername, 
      email, 
      password: passwort 
    });
    if (!validation.valid) {
      setError(validation.error);
      setLoading(false);
      return;
    }

    try {
      // Server-Anfrage: Backend macht nochmal SICHERHEITSPRÜFUNG + speichert in DB
      await apiService.register(benutzername, email, passwort);
      
      setSuccess('Konto erfolgreich erstellt! Du wirst zur Anmeldung weitergeleitet...');
      addPopup('Registrierung erfolgreich! 🎉', 'success');
      
      // Navigate to login after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Registration Error:', error);
      
      // Behandle verschiedene Fehlercodes
      if (error.errorCode === ERROR_CODES.EMAIL_EXISTS) {
        setError('Diese E-Mail Adresse wird bereits verwendet.');
      } else if (error.errorCode === ERROR_CODES.USERNAME_EXISTS) {
        setError('Dieser Benutzername existiert bereits.');
      } else if (error.errorCode === ERROR_CODES.INVALID_EMAIL) {
        setError('Ungültige E-Mail Adresse.');
      } else if (error.errorCode === ERROR_CODES.INVALID_PASSWORD) {
        setError('Passwort entspricht nicht den Anforderungen.');
      } else if (error.errorCode === ERROR_CODES.INVALID_USERNAME) {
        setError('Benutzername entspricht nicht den Anforderungen.');
      } else {
        setError(error.message || 'Registrierung fehlgeschlagen');
      }
      
      addPopup('Registrierung fehlgeschlagen! ❌', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Konto erstellen</h2>
          <p>Erstelle ein neues Konto, um Pizzas zu bestellen</p>
        </div>
        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="username">Benutzername:</label>
            <input
              type="text"
              id="username"
              className="auth-input"
              value={benutzername}
              onChange={(e) => setBenutzername(e.target.value)}
              required
            />
          </div>
          <div className="auth-form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-form-group">
            <label htmlFor="password">Passwort:</label>
            <input
              type="password"
              id="password"
              className="auth-input"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Konto wird erstellt...' : 'Konto erstellen'}
          </button>
          <div className="auth-toggle">
            Bereits ein Konto?
            <a onClick={handleBackToLogin} href="#">Anmelden</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;