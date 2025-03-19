// App.jsx
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { loginSuccess, logout } from "./redux/user/userSlice";

// Components
import Header from "./components/Header";
import Background from "./components/Background";
import PrivateRoute from "./components/PrivateRoute";

// Pages
import Home from "./pages/Home";
import SignIn from "./pages/Signin";
import SignUp from "./pages/SignUp";
import Wardrobe from "./pages/Wardrobe";
import CreateOutfit from "./pages/CreateOutfit";
import Profile from "./pages/Profile";
import AddWardrobeItem from "./pages/AddWardrobeItem";
import CalendarPage from "./pages/CalendarPage"; 
import Statistics from "./pages/Statistics"; // Example extra page

export default function App() {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const isRehydrated = useSelector((state) => state._persist?.rehydrated);

  // Track Firebase readiness
  const [authInitialized, setAuthInitialized] = useState(false);

  // Listen for Firebase auth changes once
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "User",
          accessToken: token,
        };
        dispatch(loginSuccess({ user: userData, token }));
      } else {
        dispatch(logout());
        localStorage.removeItem("currentUser");
        localStorage.removeItem("accessToken");
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, [dispatch]);

  // If Redux Persist or Firebase auth isn’t ready, show loading
  if (!isRehydrated || !authInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Background />
      <Header />

      <Routes>
        {/* Home route logic */}
        <Route
          path="/"
          element={
            currentUser === undefined ? (
              <div>Loading...</div>
            ) : currentUser === null ? (
              <Navigate to="/login" replace />
            ) : (
              <Home />
            )
          }
        />

        {/* Public routes */}
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Private routes */}
        <Route
          path="/wardrobe"
          element={
            <PrivateRoute>
              <Wardrobe />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/create-outfit"
          element={
            <PrivateRoute>
              <CreateOutfit />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-wardrobe-item"
          element={
            <PrivateRoute>
              <AddWardrobeItem />
            </PrivateRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <CalendarPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <PrivateRoute>
              <Statistics />
            </PrivateRoute>
          }
        />

        {/* Catch-all: redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
