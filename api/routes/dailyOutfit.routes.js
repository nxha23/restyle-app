// routes/dailyOutfit.routes.js
import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { setDailyOutfit, getDailyOutfit, deleteDailyOutfit } from "../controller/dailyOutfit.controller.js";

const router = express.Router();

router.post("/set", verifyToken, setDailyOutfit);
router.get("/get/:date", verifyToken, getDailyOutfit);
router.delete("/delete/:date", verifyToken, deleteDailyOutfit);

export default router;
