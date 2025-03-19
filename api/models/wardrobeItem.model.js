// src/models/wardrobeItem.model.js
import mongoose from "mongoose";

const WardrobeItemSchema = new mongoose.Schema({
  // If user picks from [tops, hoodie, jumper, ...] or "other"
  itemCategory: { type: String, required: true },
  // Only used if itemCategory === "other"
  customCategory: { type: String, default: "" },

  brand: { type: String },
  size: { type: String },
  datePurchased: { type: Date },
  imageUrl: { type: String, required: true },
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  wearCount: { type: Number, default: 0 },
});

export default mongoose.model("WardrobeItem", WardrobeItemSchema);
