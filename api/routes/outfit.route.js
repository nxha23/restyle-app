// routes/outfit.routes.js
import express from "express";
import { createOutfit, getAllOutfits, deleteOutfit } from "../controller/outfit.controller.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

router.post("/create", verifyToken, createOutfit);
router.get("/all", verifyToken, getAllOutfits);
router.delete("/delete/:id", verifyToken, deleteOutfit);

export default router;
