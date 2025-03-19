// src/components/Background.jsx
import React from 'react';
import '../styles/Background.css';

export default function Background() {
  return (
    <div className="bg-container">
      {/* 4) Dark shape at top */}
      <div className="bg-shape4 bg-dark"></div>

      {/* 1) Blue shape (top-left) */}
      <div className="bg-shape1 bg-blue"></div>

      {/* 2) Purple shape (middle) */}
      <div className="bg-shape2 bg-purple"></div>

      {/* 3) Pink shape (right/bottom) */}
      <div className="bg-shape3 bg-pink"></div>
    </div>
  );
}