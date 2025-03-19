// src/pages/AddWardrobeItem.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { storage } from "../firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import localforage from "localforage";
import "../styles/AddWardrobeItem.css";

// Predefined categories
const CATEGORIES = [
  "Top",
  "Hoodie",
  "Jumper",
  "Trouser",
  "Jeans",
  "Short",
  "Skirt",
  "Dress",
  "Jacket",
  "Shoes",
  "Other",
];

export default function AddWardrobeItem() {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  // State for file upload and errors
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form data for the wardrobe item
  const [formData, setFormData] = useState({
    itemCategory: "",
    customCategory: "",
    brand: "",
    size: "",
    datePurchased: "",
    imageUrl: "",
  });

  // Upload the file to Firebase
  const handleImageUpload = async () => {
    if (!file) {
      setImageUploadError("❌ Please select an image.");
      return;
    }
    setUploading(true);
    setImageUploadError(null);

    try {
      const fileName = `images/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          ).toFixed(0);
          console.log(`🔄 Upload is ${progress}% done`);
        },
        (err) => {
          console.error("❌ Upload failed:", err);
          setImageUploadError("❌ Image upload failed.");
          setUploading(false);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => {
              setFormData((prev) => ({ ...prev, imageUrl: downloadURL }));
              setUploading(false);
            })
            .catch((err) => {
              console.error("❌ Failed to get download URL:", err);
              setImageUploadError("❌ Could not get download URL.");
              setUploading(false);
            });
        }
      );
    } catch (err) {
      console.error("Upload error:", err);
      setImageUploadError("❌ Image upload failed or unknown error.");
      setUploading(false);
    }
  };

  // Update form fields (for brand, size, datePurchased, customCategory, etc.)
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  // Special handler for the itemCategory dropdown
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      itemCategory: value,
      // Reset customCategory if user picks something other than "other"
      customCategory: value === "other" ? prev.customCategory : "",
    }));
  };

  // Submit the wardrobe item data
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting formData:", formData);

    if (!formData.itemCategory) {
      setError("❌ Item Category is required.");
      return;
    }
    // If user picks "other," customCategory must not be empty
    if (formData.itemCategory === "other" && !formData.customCategory.trim()) {
      setError("❌ Please specify a category when selecting 'other'.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!currentUser || !token) {
      setError("❌ You must be logged in to submit wardrobe items.");
      return;
    }
    if (!formData.imageUrl) {
      setError("❌ Please upload an image before submitting.");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const userId = currentUser._id;
      const res = await fetch("/api/wardrobe/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemCategory: formData.itemCategory,
          customCategory: formData.customCategory,
          brand: formData.brand,
          size: formData.size,
          datePurchased: formData.datePurchased,
          imageUrl: formData.imageUrl,
          userRef: userId,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      console.log("✅ Wardrobe item added:", data.wardrobeItem);

      // Update localForage cache instead of localStorage
      const cachedItems = (await localforage.getItem("wardrobeItems")) || [];
      const updatedItems = [...cachedItems, data.wardrobeItem];
      await localforage.setItem("wardrobeItems", updatedItems);

      console.log("✅ Wardrobe item added successfully!");
      navigate("/wardrobe");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-wardrobe-page">
      <div className="add-wardrobe-container">
        <h1>Add Wardrobe Item</h1>

        {error && <p className="error-message">{error}</p>}
        {loading && <p className="error-message">Submitting, please wait...</p>}

        <form onSubmit={handleSubmit} className="add-wardrobe-form">
          <div className="form-row">
            {/* Left side: text/dropdown fields */}
            <div className="form-left">
              <label htmlFor="itemCategory">Item Category (required):</label>
              <select
                id="itemCategory"
                value={formData.itemCategory}
                onChange={handleCategoryChange}
                required
              >
                <option value="">-- Select Category --</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* If user picks "Other", show a text field */}
              {formData.itemCategory === "Other" && (
                <input
                  type="text"
                  id="customCategory"
                  placeholder="Specify other category"
                  value={formData.customCategory}
                  onChange={handleChange}
                  required
                  style={{ marginTop: "0.5rem" }}
                />
              )}

              <input
                type="text"
                id="brand"
                placeholder="Brand (optional)"
                value={formData.brand}
                onChange={handleChange}
              />
              <input
                type="text"
                id="size"
                placeholder="Size (optional)"
                value={formData.size}
                onChange={handleChange}
              />

              <label htmlFor="datePurchased" style={{ marginBottom: "0.25rem" }}>
                Date Purchased (optional):
              </label>
              <input
                type="date"
                id="datePurchased"
                value={formData.datePurchased}
                onChange={handleChange}
              />

              <button type="submit" disabled={uploading || loading}>
                {loading ? "Submitting..." : "Add Item"}
              </button>
            </div>

            {/* Right side: upload section */}
            <div className="form-right">
              <p>Upload One Image:</p>
              <div className="upload-container">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleImageUpload}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
              {imageUploadError && (
                <p className="error-message">{imageUploadError}</p>
              )}

              {formData.imageUrl && (
                <div className="upload-preview">
                  <h2>Uploaded Image</h2>
                  <img
                    src={formData.imageUrl}
                    alt="Wardrobe item"
                    className="uploaded-image"
                  />
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}