import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice';
import "../styles/Auth.css";

export default function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({ identifier: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with:', formData); // Debugging output
    dispatch(signInStart());

    // Determine if the identifier is an email or username
    const isEmail = formData.identifier.includes('@');
    const payload = { password: formData.password };
    if (isEmail) {
      payload.email = formData.identifier;
    } else {
      payload.username = formData.identifier;
    }

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = await res.json();
      console.log('Response data:', data); // Debugging output

      if (!res.ok || data.success === false) {
        dispatch(signInFailure(data.message || 'Sign in failed'));
      } else {
        if (data.token) {
          localStorage.setItem('accessToken', data.token);
        }
        dispatch(signInSuccess({ user: data.user, token: data.token }));
        navigate('/');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      dispatch(signInFailure(err.message));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Sign In</h1>
        {useSelector((state) => state.user).error && (
          <p className="error-message">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            id="identifier"
            type="text"
            placeholder="Email"
            onChange={handleChange}
            required
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={useSelector((state) => state.user.loading)}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
