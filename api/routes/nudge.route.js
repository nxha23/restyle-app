// api/routes/nudge.route.js
import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { getDailyNudge } from "../controller/nudge.controller.js";

const router = express.Router();

// GET /api/nudge
router.get("/", verifyToken, getDailyNudge);

export default router;