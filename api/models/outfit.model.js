// models/outfit.model.js
import mongoose from "mongoose";

const OutfitItemSchema = new mongoose.Schema({

  wardrobeItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WardrobeItem", 
    required: true,
  },
  // Coordinates on the outfit canvas
  x: { type: Number, required: true },
  y: { type: Number, required: true },
});

const outfitSchema = new mongoose.Schema(
  {
    // Reference to the user who created the outfit
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    // Array of clothing item references + their positions
    clothingItems: [OutfitItemSchema],
    // The single, merged screenshot of the outfit layout
    screenshot: { type: String },
  },
  { timestamps: true }
);

const Outfit = mongoose.model("Outfit", outfitSchema);
export default Outfit;
