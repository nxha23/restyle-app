// src/pages/CreateOutfit.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import domtoimage from "dom-to-image";
import DraggableItem from "./DraggableItem";

// Import your CSS
import "../styles/CreateOutfit.css";

const CreateOutfit = () => {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Toggle for hiding the remove ("X") buttons before screenshot
  const [hideRemoveButtons, setHideRemoveButtons] = useState(false);

  // This ref will define the bounding box for drag constraints
  const outfitCanvasRef = useRef(null);

  // Ref for the horizontal wardrobe items container (for arrow scrolling)
  const itemsContainerRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      setError("You must be logged in to create an outfit.");
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }

    // Fetch wardrobe items
    fetch("/api/wardrobe/get", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.success === false) {
          setError(data.message || "Failed to load wardrobe items.");
        } else {
          setWardrobeItems(Array.isArray(data.items) ? data.items : []);
        }
      })
      .catch((err) => setError(err.message));
  }, [currentUser]);

  // When a wardrobe item is clicked, add it to the canvas
  const handleSelect = (item) => {
    // Prevent duplicates
    if (selectedItems.some((i) => i._id === item._id)) return;

    setSelectedItems((prev) => [
      ...prev,
      { ...item, uid: Date.now().toString(), x: 100, y: 100 },
    ]);
  };

  // Scroll left/right in the top wardrobe container
  const scrollLeft = () => {
    itemsContainerRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };
  const scrollRight = () => {
    itemsContainerRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  // Save the outfit by capturing a screenshot and sending data to the backend
  const handleSave = async () => {
    if (selectedItems.length === 0) {
      setError("Please select at least one clothing item.");
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Hide remove buttons before capturing
      setHideRemoveButtons(true);

      // Wait for the DOM to update
      await new Promise((resolve) => setTimeout(resolve, 0));
      const node = outfitCanvasRef.current;
      const dataUrl = await domtoimage.toPng(node);

      // Restore remove buttons
      setHideRemoveButtons(false);

      // Only send wardrobeItemId, x, and y. The imageUrl is not duplicated here.
      const clothingItemsData = selectedItems.map((item) => ({
        wardrobeItemId: item._id,
        x: item.x,
        y: item.y,
      }));

      const res = await fetch("/api/outfit/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clothingItems: clothingItemsData,
          screenshot: dataUrl,
        }),
      });

      const responseData = await res.json();
      if (!responseData.success) throw new Error(responseData.message);

      console.log("✅ Outfit saved successfully!");
      navigate("/wardrobe");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setHideRemoveButtons(false);
    }
  };

  return (
    <div className="create-outfit-page">
      <h1>Create Outfit</h1>

      {/* Wardrobe header + arrow buttons */}
      <div className="top-wardrobe-header">
        <h2>Your Wardrobe:</h2>
        <div className="arrow-buttons">
          <button onClick={scrollLeft} className="arrow-button">
            ←
          </button>
          <button onClick={scrollRight} className="arrow-button">
            →
          </button>
        </div>
      </div>

      {/* Horizontal scroll container for the items */}
      <div className="top-wardrobe-items" ref={itemsContainerRef}>
        {wardrobeItems.map((item) => (
          <motion.div
            key={item._id}
            onClick={() => handleSelect(item)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="wardrobe-item"
          >
            <img
              src={item.imageUrl}
              alt={item.itemCategory}
              className="wardrobe-item-img"
            />
            <span>{item.itemCategory}</span>
          </motion.div>
        ))}
      </div>

      {/* Canvas area with a transparent background, used as drag boundary */}
      <div
        className="outfit-canvas-container relative"
        style={{ width: "100%", height: "500px", overflow: "hidden" }}
        ref={outfitCanvasRef}
      >
        <AnimatePresence>
          {selectedItems.map((item) => (
            <DraggableItem
              key={item.uid}
              item={item}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              hideRemoveButtons={hideRemoveButtons}
              // Pass the container ref to DraggableItem
              containerRef={outfitCanvasRef}
            />
          ))}
        </AnimatePresence>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className={`save-outfit-btn ${loading ? "loading" : ""}`}
      >
        {loading ? "Saving..." : "Save Outfit"}
      </button>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default CreateOutfit;
