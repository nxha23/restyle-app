// src/components/PrivateRoute.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const { currentUser } = useSelector((state) => state.user);

  if (currentUser === undefined) {
    return <div>Loading...</div>;
  }

  if (currentUser === null) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
