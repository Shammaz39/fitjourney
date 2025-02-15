// AuthForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, login } from '../services/authService';
import '../styles/AuthForm.css'; // Importing CSS file

const AuthForm = ({ type }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (type === 'signUp') {
        await signUp(email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered. Try logging in.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Try again.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid email or password. Please try again.');
          break;
        default:
          setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{type === 'signUp' ? 'Sign Up' : 'Log In'}</h2>
      {error && <p className="auth-error">{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="auth-input" />
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Processing...' : type === 'signUp' ? 'Sign Up' : 'Log In'}
        </button>
      </form>
      <p className="auth-switch-text">
        {type === 'signUp' ? 'Already have an account?' : "Don't have an account?"}
        <button onClick={() => navigate(type === 'signUp' ? '/login' : '/signup')} className="auth-switch-button">
          {type === 'signUp' ? 'Log In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
};

export default AuthForm;
