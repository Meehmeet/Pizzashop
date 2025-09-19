import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      });

      const data = await response.json();

      if (response.status === 201) {
        setSuccess('Konto erfolgreich erstellt!');
        
        // Navigate to login after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setError(data.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (error) {
      setError('Verbindungsfehler. Bitte versuchen Sie es später erneut.');
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
          <p>Erstelle ein Konto und bestelle leckere Pizza</p>
        </div>
        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="username">Nutzername:</label>
            <input
              type="text"
              id="username"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Registrieren...' : 'Registrieren'}
          </button>
          <div className="auth-toggle">
            Bereits ein Konto?
            <a onClick={handleBackToLogin} href="#">Zurück zur Anmeldung</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
