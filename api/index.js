import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

// Import Routers
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.routes.js";
import wardrobeRouter from "./routes/wardrobe.route.js";
import outfitRouter from "./routes/outfit.route.js";
import challengeRouter from "./routes/challenge.route.js";
import nudgeRouter from "./routes/nudge.route.js";
import dailyOutfitRoutes from "./routes/dailyOutfit.routes.js";
import streakRoutes from "./routes/streak.route.js";
import { globalErrorHandler } from "./utils/error.js";

dotenv.config(); // Load environment variables

// ✅ **1️⃣ Connect to MongoDB**
mongoose.set("strictQuery", true); // Prevent deprecation warnings
mongoose
  .connect(process.env.MONGO)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB", err);
    process.exit(1); // Exit on failure
  });

// ✅ **2️⃣ Create Express App**
const app = express();
const __dirname = path.resolve();

// ✅ **3️⃣ CORS Middleware**
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Ensure correct frontend URL
    credentials: true, // Allow cookies/auth
  })
);

// ✅ **4️⃣ Middleware - Fix PayloadTooLargeError**
app.use(express.json({ limit: "50mb" })); // Allow large JSON payloads
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // Allow large URL-encoded data
app.use(cookieParser());

// ✅ **5️⃣ Define API Routes**
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/wardrobe", wardrobeRouter);
app.use("/api/outfit", outfitRouter);
app.use("/api/challenge", challengeRouter);
app.use("/api/nudge", nudgeRouter);
app.use("/api/dailyOutfit", dailyOutfitRoutes);
app.use("/api/streak", streakRoutes); // Mount streak routes

// ✅ **6️⃣ Serve React Frontend in Production**
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
  });
}

// ✅ **7️⃣ Global Error Handling**
app.use(globalErrorHandler);

// ✅ **8️⃣ Start Server**
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
