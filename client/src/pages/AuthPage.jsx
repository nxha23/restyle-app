// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';

export default function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.user);

  const [isSignUp, setIsSignUp] = useState(false);

  // Shared form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  // Handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(signInStart());

    try {
      if (isSignUp) {
        // SIGN UP
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();

        if (data.success === false) {
          dispatch(signInFailure(data.message));
          return;
        }
        console.log('Account created! Please sign in.');
        setIsSignUp(false);

      } else {
        // SIGN IN
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });
        const data = await res.json();

        if (data.success === false) {
          dispatch(signInFailure(data.message));
          return;
        }

        // Store token in localStorage
        if (data.token) {
          localStorage.setItem('accessToken', data.token);
        }

        const userPayload = {
          ...data.user,
          token: data.token,
        };

        dispatch(signInSuccess(userPayload));

        // Navigate to Wardrobe
        navigate('/wardrobe');
      }
    } catch (err) {
      dispatch(signInFailure(err.message));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Auth Card */}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h1>

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Only show "Username" field if signing up */}
          {isSignUp && (
            <input
              id="username"
              type="text"
              placeholder="Username"
              className="border p-2 rounded"
              value={formData.username}
              onChange={handleChange}
              required
            />
          )}

          <input
            id="email"
            type="email"
            placeholder="Email"
            className="border p-2 rounded"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            id="password"
            type="password"
            placeholder="Password"
            className="border p-2 rounded"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button
            disabled={loading}
            className="bg-slate-700 text-white p-2 rounded hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? isSignUp
                ? 'Creating account...'
                : 'Signing in...'
              : isSignUp
              ? 'Sign Up'
              : 'Sign In'}
          </button>
        </form>

        <div className="text-sm text-center mt-4">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <span
                onClick={() => setIsSignUp(false)}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Sign In
              </span>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <span
                onClick={() => setIsSignUp(true)}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Sign Up
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}