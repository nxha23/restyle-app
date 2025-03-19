import express from "express";
import { getStreak, confirmStreak } from "../controller/streak.controller.js";
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// GET /api/streak - Returns the user's current streak and last streak date.
router.get("/", verifyToken, getStreak);

// POST /api/streak/confirm - Confirms today's outfit and updates the user's streak.
router.post("/confirm", verifyToken, confirmStreak);

export default router;
