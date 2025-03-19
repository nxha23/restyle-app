import mongoose from "mongoose";

const ChallengeSchema = new mongoose.Schema({
  userRef: { type: String, required: true },
  challengeType: { type: String, required: true },
  locked: { type: Boolean, default: true }, // starts locked
  progress: { type: Number, default: 0 },
  goal: { type: Number, default: 30 },
});

export default mongoose.model("Challenge", ChallengeSchema);
