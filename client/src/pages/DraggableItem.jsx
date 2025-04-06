// src/pages/DraggableItem.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";

const DraggableItem = ({
  item,
  selectedItems,
  setSelectedItems,
  hideRemoveButtons,
  containerRef,
}) => {
  const [position, setPosition] = useState({ x: item.x, y: item.y });

  // Remove this item from the canvas
  const handleRemove = () => {
    setSelectedItems((prev) => prev.filter((p) => p.uid !== item.uid));
  };

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        x: position.x,
        y: position.y,
        width: "250px",
        height: "250px",
      }}
      drag
      dragConstraints={containerRef}
      dragMomentum={false}
      dragElastic={0.1}
      onMouseDown={(e) => {
        e.preventDefault();
        setPosition((prev) => ({ ...prev, x: prev.x + 0.1, y: prev.y + 0.1 }));
      }}
      onDragEnd={(_, info) => {
        setPosition({ x: info.point.x, y: info.point.y });
        setSelectedItems((prev) =>
          prev.map((p) =>
            p.uid === item.uid ? { ...p, x: info.point.x, y: info.point.y } : p
          )
        );
      }}
    >
      <img
        src={item.imageUrl}
        alt="Selected Item"
        className="w-full h-full object-contain rounded"
      />
      {!hideRemoveButtons && (
        <motion.button
          onClick={handleRemove}
          whileHover={{ scale: 1.2, rotate: 10 }}
          whileTap={{ scale: 0.8 }}
          className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1 rounded"
        >
          ✖
        </motion.button>
      )}
    </motion.div>
  );
};

export default DraggableItem;
