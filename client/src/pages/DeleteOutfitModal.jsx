// pages/DeleteOutfitModal.jsx
import React from "react";

const DeleteOutfitModal = ({ outfit, onClose, onDelete }) => {
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this outfit?")) {
      await onDelete(outfit._id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* Use an arbitrary value class to get a translucent background */}
      <div className="bg-[rgba(71,69,69)] rounded p-6 w-80">
        <h2 className="text-xl font-bold mb-4">Delete Outfit</h2>
        {outfit.screenshot ? (
          <img
            src={outfit.screenshot}
            alt="Outfit Screenshot"
            className="w-full h-48 object-contain mb-4"
          />
        ) : (
          <div className="w-full h-48 bg-gray-300 flex items-center justify-center mb-4">
            <p>No Screenshot</p>
          </div>
        )}
        <p className="mb-4">
          Once deleted, you will need to create a new outfit.
        </p>
        <div className="flex justify-end">
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded mr-2"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteOutfitModal;
