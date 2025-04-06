import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { app } from '../firebase';
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signOutUserStart,
  signOutUserSuccess,
  signOutUserFailure,
} from '../redux/user/userSlice';
import "../styles/Profile.css"; 

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentUser, loading, error } = useSelector((state) => state.user);

  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});

  const fileRef = useRef(null);

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(progress));
      },
      (err) => {
        setFileUploadError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData((prev) => ({ ...prev, avatar: downloadURL }));
        });
      }
    );
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?._id) return;

    dispatch(updateUserStart());

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        dispatch(updateUserFailure("No token found. Please log in."));
        return;
      }

      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }

      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (err) {
      dispatch(updateUserFailure(err.message));
    }
  };

  const handleDeleteUser = async () => {
    if (!currentUser?._id) return;
    if (!window.confirm('Are you sure you want to delete your account?')) return;

    dispatch(deleteUserStart());

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        dispatch(deleteUserFailure("No token found. Please log in."));
        return;
      }

      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
      navigate('/signup');
    } catch (err) {
      dispatch(deleteUserFailure(err.message));
    }
  };

  const handleSignOut = async () => {
    dispatch(signOutUserStart());
    try {
      const token = localStorage.getItem("accessToken");

      const res = await fetch('/api/auth/signout', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.success === false) {
        dispatch(signOutUserFailure(data.message));
        return;
      }
      dispatch(signOutUserSuccess(data));
      navigate('/login');
    } catch (err) {
      dispatch(signOutUserFailure(err.message));
    }
  };

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <h2 className="text-2xl font-semibold mb-4">Profile</h2>
          <p className="text-xl">You must be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Your Profile</h1>

        {error && <p className="error-message">{error}</p>}
        {updateSuccess && <p className="success-message">Profile updated successfully!</p>}

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Avatar Upload */}
          <div className="profile-avatar">
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              hidden
              onChange={(e) => setFile(e.target.files[0])}
            />
            <img
              src={formData.avatar || currentUser.avatar}
              alt="profile"
              onClick={() => fileRef.current.click()}
            />
            <p>Click image to change avatar</p>
            {fileUploadError ? (
              <p className="error-message">Error uploading image (must be &lt; 2 MB)</p>
            ) : filePerc > 0 && filePerc < 100 ? (
              <p className="success-message">Uploading... {filePerc}%</p>
            ) : filePerc === 100 ? (
              <p className="success-message">Image upload complete!</p>
            ) : null}
          </div>

          {/* Username */}
          <input
            id="username"
            type="text"
            placeholder="Username"
            defaultValue={currentUser.username}
            onChange={handleChange}
          />

          {/* Email */}
          <input
            id="email"
            type="email"
            placeholder="Email"
            defaultValue={currentUser.email}
            onChange={handleChange}
          />

          {/* Password */}
          <input
            id="password"
            type="password"
            placeholder="New password"
            onChange={handleChange}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        {/* Delete & Sign Out Actions */}
        <div className="profile-actions">
  <span className="delete-account" onClick={handleDeleteUser}>
    Delete Account
  </span>
  <span className="sign-out" onClick={handleSignOut}>
    Sign Out
  </span>
</div>
      </div>
    </div>
  );
}
