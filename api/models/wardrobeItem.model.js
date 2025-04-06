// src/models/wardrobeItem.model.js
import mongoose from "mongoose";

const WardrobeItemSchema = new mongoose.Schema({

  itemCategory: { type: String, required: true },
  customCategory: { type: String, default: "" },

  brand: { type: String },
  size: { type: String },
  datePurchased: { type: Date },
  imageUrl: { type: String, required: true },
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  wearCount: { type: Number, default: 0 },
});

export default mongoose.model("WardrobeItem", WardrobeItemSchema);
