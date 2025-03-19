// src/components/PrivateRoute.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const { currentUser } = useSelector((state) => state.user);

  if (currentUser === undefined) {
    // Auth state is still being determined
    return <div>Loading...</div>;
  }

  if (currentUser === null) {
    // User is definitely not logged in
    return <Navigate to="/login" replace />;
  }

  return children;
}
