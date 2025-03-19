// api/routes/wardrobe.route.js
import express from "express";
import {
  addWardrobeItem, // ← Changed from createWardrobeItem to addWardrobeItem
  deleteWardrobeItem,
  updateWardrobeItem,
  getWardrobeItem,
  getWardrobeItems,
  getWearStatistics,
} from "../controller/wardrobe.controller.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

// Use addWardrobeItem in your creation route
router.post("/create", verifyToken, addWardrobeItem);
router.delete("/delete/:id", verifyToken, deleteWardrobeItem);
router.post("/update/:id", verifyToken, updateWardrobeItem);
router.get("/get/:id", verifyToken, getWardrobeItem);
router.get("/get", verifyToken, getWardrobeItems);
router.get("/statistics", verifyToken, getWearStatistics);

export default router;
