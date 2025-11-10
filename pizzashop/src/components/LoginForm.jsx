import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
// Frontend-Validierung für sofortiges User-Feedback (arbeitet mit Backend zusammen)
import { validateLogin } from '../utils/validation';
import { ERROR_CODES, STATUS_CODES } from '../utils/errorcode';

const LoginForm = ({ addPopup }) => {
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Frontend-Validierung: Basis-Check OHNE Server (E-Mail Format, Felder vorhanden)
    // Backend macht später die echte Passwort-Prüfung mit Datenbank
    const validation = validateLogin({ email, password: passwort });
    if (!validation.valid) {
      setError(validation.error);
      setLoading(false);
      return;
    }

    try {
      // Server-Anfrage: Backend prüft Passwort, erstellt JWT-Token
      const data = await apiService.login(email, passwort);
      
      // Speichere User-Daten mit Token (für alle User)
      const userWithToken = {
        ...data.user,
        email: email, // E-Mail explizit hinzufügen
        token: data.token
      };
      
      localStorage.setItem('pizzashop_currentUser', JSON.stringify(userWithToken));
      
      // Prüfe ob es sich um den Admin handelt
      if (email === 'root@gmail.com') {
        // Leite zur Admin-Seite weiter
        addPopup('Admin erfolgreich angemeldet! 🔐', 'success');
        // Öffne Admin-Panel und schließe normales Frontend
        setTimeout(() => {
          window.open('http://10.115.2.19:8083', '_blank');
          window.close(); // Schließe das normale Frontend
        }, 1000);
        return;
      }
      
      addPopup('Erfolgreich angemeldet! 🎉', 'success');
      navigate('/homepage');
    } catch (error) {
      console.error('Login Error:', error);
      
      // Behandle verschiedene Fehlercodes
      if (error.errorCode === ERROR_CODES.TOO_MANY_REQUESTS) {
        setError('Zu viele Login-Versuche. Bitte warte 30 Sekunden.');
        addPopup('Zu viele Versuche. Warte 30 Sekunden! ⏳', 'error');
      } else if (error.errorCode === ERROR_CODES.INVALID_CREDENTIALS) {
        setError('E-Mail oder Passwort ist falsch.');
      } else if (error.errorCode === ERROR_CODES.INVALID_EMAIL) {
        setError('Ungültige E-Mail Adresse.');
      } else {
        setError(error.message || 'Anmeldung fehlgeschlagen');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Anmelden</h2>
          <p>Melde dich an, um Pizzas zu bestellen</p>
        </div>
        <form onSubmit={handleLogin} className="auth-form">
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
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
          <div className="auth-toggle">
            Noch kein Konto?
            <a onClick={handleRegisterClick} href="#">Konto erstellen</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
