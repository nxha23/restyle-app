// src/pages/SignUp.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { signInStart, signInFailure, signUpSuccess } from "../redux/user/userSlice";
import "../styles/Auth.css"; 

export default function SignUp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(signInStart());
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(signInFailure(data.message));
      } else {
        dispatch(signUpSuccess({ user: data.user, token: data.token }));
        console.log('Account created! You are now signed in.');
        navigate('/');
      }
    } catch (err) {
      dispatch(signInFailure(err.message));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Sign Up</h1>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-sm text-center mt-3">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
