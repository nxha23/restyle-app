// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import '../styles/Header.css'; 

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);

  return (
    <header className="header">
      <div className="header-container">
        {/* Left: Brand */}
        <Link to="/" className="header-brand">
          ReStyle
        </Link>

        {/* Middle: Nav links */}
        <nav className="header-nav">
          <Link to="/">Home</Link>
          <Link to="/wardrobe">Wardrobe</Link>
          <Link to="/calendar">Calendar</Link>
          <Link to="/statistics">Statistics</Link>
        </nav>

        {/* Right: Profile (if logged in) or Login/Sign Up */}
        {currentUser ? (
          <Link to="/profile" className="header-profile">
            <img
              src={currentUser.avatar}
              alt="profile"
            />
            <span>{currentUser.username}</span>
          </Link>
        ) : (
          <div className="header-login-signup">
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}