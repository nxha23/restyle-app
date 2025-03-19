import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// Import your logout action from Redux actions
import { logoutUser } from "../redux/actions";

export default function Logout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  const handleLogout = () => {
    if (currentUser && currentUser._id) {
      // Clear user-specific cached data
      localStorage.removeItem(`wardrobeItems_${currentUser._id}`);
      localStorage.removeItem(`outfits_${currentUser._id}`);
    }
    // Remove the access token
    localStorage.removeItem("accessToken");

    // Dispatch the logout action to clear Redux state
    dispatch(logoutUser());

    // Redirect to the login page
    navigate("/login");
  };

  return <button onClick={handleLogout}>Logout</button>;
}
