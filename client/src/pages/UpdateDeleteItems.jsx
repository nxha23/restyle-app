// src/pages/UpdateDeleteItems.jsx
import React, { useState } from "react";
import "../styles/UpdateDeleteItems.css";

// Reuse the same category list
// Note "Other" is capitalized; we must check for "Other" consistently in the code
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

export default function UpdateDeleteItems({ item, onClose, onRefresh }) {
  const token = localStorage.getItem("accessToken");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Local edit state includes customCategory
  const [editData, setEditData] = useState({
    itemCategory: item.itemCategory || "",
    customCategory: item.customCategory || "",
    brand: item.brand || "",
    size: item.size || "",
    datePurchased: item.datePurchased
      ? new Date(item.datePurchased).toISOString().slice(0, 10)
      : "",
  });

  // Enter edit mode
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Delete item
  const handleDelete = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/wardrobe/delete/${item._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      console.log("Item deleted successfully!");
      onRefresh(); // refresh parent
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle changes for brand, size, datePurchased, customCategory, etc.
  const handleChange = (e) => {
    setEditData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  // Special handler for itemCategory dropdown
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setEditData((prev) => ({
      ...prev,
      itemCategory: value,
      // If user picks "Other," keep customCategory; otherwise reset it
      customCategory: value === "Other" ? prev.customCategory : "",
    }));
  };

  // Submit edits
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // If user picks "Other," customCategory is required
    if (editData.itemCategory === "Other" && !editData.customCategory.trim()) {
      setError("Please specify a category when selecting 'Other'.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/wardrobe/update/${item._id}`, {
        method: "POST", // or "PUT"
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // Update local item so we see changes immediately
      item.itemCategory = editData.itemCategory;
      item.customCategory = editData.customCategory;
      item.brand = editData.brand;
      item.size = editData.size;
      item.datePurchased = editData.datePurchased
        ? new Date(editData.datePurchased).toISOString()
        : null;

        console.log("Item updated successfully!");

      // Let parent re-fetch if needed
      onRefresh();

      // Switch back to view mode
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        {/* VIEW MODE */}
        {!isEditing ? (
          <div className="view-mode">
            <img
              src={item.imageUrl}
              alt={item.itemCategory}
              className="item-image"
            />
            <h2 className="item-title">
              {/* If itemCategory is "Other" and there's a customCategory, show "Other: <custom>" */}
              {item.itemCategory === "Other" && item.customCategory
                ? `Other: ${item.customCategory}`
                : item.itemCategory || "No Category"}
            </h2>
            {item.brand && <p>Brand: {item.brand}</p>}
            {item.size && <p>Size: {item.size}</p>}
            {item.datePurchased && (
              <p>Date: {new Date(item.datePurchased).toLocaleDateString()}</p>
            )}

            {error && <p className="error-text">{error}</p>}

            <div className="btn-row">
              <button className="edit-btn" onClick={handleEditClick}>
                Edit
              </button>
              <button className="delete-btn" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        ) : (
          // EDIT MODE
          <form onSubmit={handleEditSubmit} className="edit-mode">
            <img
              src={item.imageUrl}
              alt={item.itemCategory}
              className="item-image"
            />

            <label className="label">Item Category:</label>
            <select
              id="itemCategory"
              value={editData.itemCategory}
              onChange={handleCategoryChange}
              className="edit-input"
              required
            >
              <option value="">-- Select Category --</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Show the customCategory field if user picks "Other" */}
            {editData.itemCategory === "Other" && (
              <>
                <label className="label">Specify Other:</label>
                <input
                  type="text"
                  id="customCategory"
                  value={editData.customCategory}
                  onChange={handleChange}
                  className="edit-input"
                  required
                />
              </>
            )}

            <label className="label">Brand:</label>
            <input
              type="text"
              id="brand"
              value={editData.brand}
              onChange={handleChange}
              className="edit-input"
            />

            <label className="label">Size:</label>
            <input
              type="text"
              id="size"
              value={editData.size}
              onChange={handleChange}
              className="edit-input"
            />

            <label className="label">Date Purchased:</label>
            <input
              type="date"
              id="datePurchased"
              value={editData.datePurchased}
              onChange={handleChange}
              className="edit-input"
            />

            {error && <p className="error-text">{error}</p>}

            <div className="btn-row">
              <button type="submit" className="edit-btn" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="delete-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
