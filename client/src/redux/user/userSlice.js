import { createSlice } from "@reduxjs/toolkit";

// Try to load user and token from localStorage
const storedUser = JSON.parse(localStorage.getItem("currentUser"));
const storedToken = localStorage.getItem("accessToken");

const initialState = {
  // Use undefined if nothing stored to indicate auth not yet determined
  currentUser: storedUser === null ? undefined : storedUser,
  accessToken: storedToken || undefined,
  error: null,
  loading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Sign In
    signInStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    signInSuccess: (state, action) => {
      // Expect payload: { user: {...}, token: "..." }
      state.currentUser = action.payload.user;
      state.accessToken = action.payload.token;
      state.loading = false;
      state.error = null;
      localStorage.setItem("currentUser", JSON.stringify(action.payload.user));
      localStorage.setItem("accessToken", action.payload.token);
    },
    signInFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    // Sign Up
    signUpSuccess: (state, action) => {
      state.currentUser = action.payload.user;
      state.accessToken = action.payload.token;
      state.loading = false;
      state.error = null;
      localStorage.setItem("currentUser", JSON.stringify(action.payload.user));
      localStorage.setItem("accessToken", action.payload.token);
    },
    // For Firebase Auth changes (onAuthStateChanged)
    loginSuccess: (state, action) => {
      state.currentUser = action.payload.user;
      state.accessToken = action.payload.token;
      state.loading = false;
      state.error = null;
      localStorage.setItem("currentUser", JSON.stringify(action.payload.user));
      localStorage.setItem("accessToken", action.payload.token);
    },
    // Update User Profile
    updateUserStart: (state) => {
      state.loading = true;
    },
    updateUserSuccess: (state, action) => {
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
      localStorage.setItem("currentUser", JSON.stringify(action.payload));
    },
    updateUserFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    // Delete User Account
    deleteUserStart: (state) => {
      state.loading = true;
    },
    deleteUserSuccess: (state) => {
      state.currentUser = null;
      state.accessToken = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("currentUser");
      localStorage.removeItem("accessToken");
    },
    deleteUserFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    // Sign Out
    signOutUserStart: (state) => {
      state.loading = true;
    },
    signOutUserSuccess: (state) => {
      state.currentUser = null;
      state.accessToken = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("currentUser");
      localStorage.removeItem("accessToken");
    },
    signOutUserFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.currentUser = null;
      state.accessToken = null;
      localStorage.removeItem("currentUser");
      localStorage.removeItem("accessToken");
    },
  },
});

export const {
  signInStart,
  signInSuccess,
  signInFailure,
  signUpSuccess,
  loginSuccess,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signOutUserStart,
  signOutUserSuccess,
  signOutUserFailure,
  logout,
} = userSlice.actions;

export default userSlice.reducer;
