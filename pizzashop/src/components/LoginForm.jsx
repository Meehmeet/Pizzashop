import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: passwort
        })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        localStorage.setItem('pizzashop_currentUser', JSON.stringify(data.user));
        navigate('/homepage');
      } else {
        setError(data.error || 'Email oder Passwort ist falsch');
      }
    } catch (error) {
      setError('Verbindungsfehler. Bitte versuchen Sie es später erneut.');
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
