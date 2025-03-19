// models/dailyOutfit.model.js
import mongoose from "mongoose";

const DailyOutfitSchema = new mongoose.Schema({
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // The date for which the user picks an outfit (just store year/month/day)
  date: { type: Date, required: true },
  // The chosen outfit
  outfitRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Outfit",
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("DailyOutfit", DailyOutfitSchema);
