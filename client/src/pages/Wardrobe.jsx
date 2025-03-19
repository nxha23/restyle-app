// src/pages/Wardrobe.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import localforage from "localforage";
import UpdateDeleteItems from "./UpdateDeleteItems";
import DeleteOutfitModal from "./DeleteOutfitModal";
import "../styles/Wardrobe.css";

export default function Wardrobe() {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [error, setError] = useState(null);

  // For editing/deleting a wardrobe item
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  // For outfits
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [showOutfitModal, setShowOutfitModal] = useState(false);

  // Refs for horizontal scrolling
  const wardrobeRef = useRef(null);
  const outfitsRef = useRef(null);

  useEffect(() => {
    loadCachedData(); // Load instantly from localForage
    fetchData();      // Fetch fresh data from backend in the background
  }, []);

  const loadCachedData = async () => {
    const cached = await localforage.getItem("wardrobeItems");
    if (cached) setWardrobeItems(cached);
  };

  const fetchData = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }
    if (!currentUser) {
      setError("No current user found. Please log in.");
      return;
    }

    try {
      const [itemsRes, outfitsRes] = await Promise.all([
        fetch("/api/wardrobe/get", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/outfit/all", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const dataItems = await itemsRes.json();
      const dataOutfits = await outfitsRes.json();

      if (!dataItems.success) {
        setError(dataItems.message || "Failed to load wardrobe items.");
      } else {
        setWardrobeItems(dataItems.items);
        await localforage.setItem("wardrobeItems", dataItems.items);
      }

      if (!dataOutfits.success) {
        setError(dataOutfits.message || "Failed to load outfits.");
      } else {
        setOutfits(dataOutfits.outfits);
      }
    } catch (err) {
      setError("Failed to fetch data.");
    }
  };

  // Scroll handlers for Wardrobe
  const scrollWardrobeLeft = () => {
    wardrobeRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };
  const scrollWardrobeRight = () => {
    wardrobeRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  // Scroll handlers for Outfits
  const scrollOutfitsLeft = () => {
    outfitsRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };
  const scrollOutfitsRight = () => {
    outfitsRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  // Wardrobe item click => open modal
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleItemRefresh = async () => {
    setShowItemModal(false);
    setSelectedItem(null);
    await fetchData();
  };

  // Delete an outfit
  const handleDeleteOutfit = async (id) => {
    const token = localStorage.getItem("accessToken");
    if (!token || !currentUser) return;

    try {
      await fetch(`/api/outfit/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Remove from local state
      const updatedOutfits = outfits.filter((o) => o._id !== id);
      setOutfits(updatedOutfits);
    } catch (err) {
      setError("Failed to delete outfit.");
    }
  };

  // Outfit click => open DeleteOutfitModal
  const handleOutfitClick = (outfit) => {
    setSelectedOutfit(outfit);
    setShowOutfitModal(true);
  };

  return (
    <div className="wardrobe-page">
      {error && <p className="error-message">{error}</p>}

      {/* --- WARDROBE SECTION --- */}
      <div className="wardrobe-section">
        <div className="section-header">
          <h1>Your Wardrobe</h1>
          <div className="arrow-buttons">
            <button onClick={scrollWardrobeLeft} className="arrow-button">←</button>
            <button onClick={scrollWardrobeRight} className="arrow-button">→</button>
          </div>
        </div>

        <div ref={wardrobeRef} className="wardrobe-grid">
          {/* + Add Item Card */}
          <div
            onClick={() => navigate("/add-wardrobe-item")}
            className="wardrobe-card add-card"
          />
          {wardrobeItems.map((item) => (
            <div
              key={item._id}
              onClick={() => handleItemClick(item)}
              className="wardrobe-card"
            >
              <img
                src={item.imageUrl}
                alt={item.itemCategory || "Wardrobe Item"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* --- OUTFITS SECTION --- */}
      <div className="outfits-section">
        <div className="section-header">
          <h2>Your Outfits</h2>
          <div className="arrow-buttons">
            <button onClick={scrollOutfitsLeft} className="arrow-button">←</button>
            <button onClick={scrollOutfitsRight} className="arrow-button">→</button>
          </div>
        </div>

        <div ref={outfitsRef} className="wardrobe-grid">
          {/* + Create Outfit Card */}
          <div
            onClick={() => navigate("/create-outfit")}
            className="wardrobe-card add-card outfit-card"
          />
          {outfits.map((outfit) => (
            <div
              key={outfit._id}
              onClick={() => handleOutfitClick(outfit)}
              className="wardrobe-card outfit-card"
            >
              {outfit.screenshot ? (
                <img
                  src={outfit.screenshot}
                  alt="Outfit Screenshot"
                />
              ) : (
                <div className="no-screenshot">
                  <p>No Screenshot</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal for editing/deleting a wardrobe item */}
      {showItemModal && selectedItem && (
        <UpdateDeleteItems
          item={selectedItem}
          onClose={() => setShowItemModal(false)}
          onRefresh={handleItemRefresh}
        />
      )}

      {/* Modal for deleting an outfit */}
      {showOutfitModal && selectedOutfit && (
        <DeleteOutfitModal
          outfit={selectedOutfit}
          onClose={() => {
            setShowOutfitModal(false);
            setSelectedOutfit(null);
          }}
          onDelete={handleDeleteOutfit}
        />
      )}
    </div>
  );
}