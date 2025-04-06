import express from "express";
import { getStreak, confirmStreak } from "../controller/streak.controller.js";
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// GET /api/streak 
router.get("/", verifyToken, getStreak);

// POST /api/streak/confirm
router.post("/confirm", verifyToken, confirmStreak);

export default router;
