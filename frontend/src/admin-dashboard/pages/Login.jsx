import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ad-login-screen">
      <form className="ad-login-card" onSubmit={handleSubmit}>
        <div className="ad-login-brand">
          <div className="ad-login-mark">N</div>
          <h1>NWSSU Campus Tour</h1>
          <p className="ad-login-sub">Sign in to the Admin Dashboard</p>
        </div>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {error && <p className="ad-login-error">{error}</p>}

        <button className="ad-login-submit" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}