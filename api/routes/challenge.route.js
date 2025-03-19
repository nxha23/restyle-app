import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import {
  createChallenge,
  updateChallenge,
  getChallenges,
  resetChallenge,
  deleteChallenge,
} from "../controller/challenge.controller.js";

const router = express.Router();

router.post("/create", verifyToken, createChallenge);
router.post("/update/:id", verifyToken, updateChallenge);
router.get("/all", verifyToken, getChallenges);
router.post("/reset/:id", verifyToken, resetChallenge);
router.delete("/delete/:id", verifyToken, deleteChallenge);

export default router;
