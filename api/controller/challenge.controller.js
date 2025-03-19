import Challenge from "../models/challenge.model.js";
import { createError } from "../utils/error.js";

export const createChallenge = async (req, res, next) => {
  try {
    const { challengeType, progress, status, goal } = req.body;

    // Create a new challenge for this user
    const challenge = await Challenge.create({
      userRef: req.user.id,
      challengeType,
      status: status || undefined,
      progress: progress || 0,
      goal: goal || 30, // default goal if not provided
      // locked is defaulted to true in the model
    });

    return res.status(201).json({
      success: true,
      challenge,
    });
  } catch (error) {
    next(error);
  }
};

export const updateChallenge = async (req, res, next) => {
  try {
    // Find the challenge by ID
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return next(createError(404, "Challenge not found!"));
    }
    // Ensure user owns this challenge
    if (req.user.id !== challenge.userRef.toString()) {
      return next(createError(401, "You can only update your own challenge!"));
    }
    // Update with the request body (could include progress, locked, etc.)
    const updatedChallenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return res.status(200).json({
      success: true,
      challenge: updatedChallenge,
    });
  } catch (error) {
    next(error);
  }
};

export const getChallenges = async (req, res, next) => {
  try {
    // Return all challenges for this user
    const challenges = await Challenge.find({ userRef: req.user.id });
    return res.status(200).json({
      success: true,
      challenges,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return next(createError(404, "Challenge not found!"));
    }
    if (req.user.id !== challenge.userRef.toString()) {
      return next(createError(401, "You can only delete your own challenge!"));
    }
    await Challenge.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Challenge has been deleted!",
    });
  } catch (error) {
    next(error);
  }
};

export const resetChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return next(createError(404, "Challenge not found!"));
    }
    if (req.user.id !== challenge.userRef.toString()) {
      return next(createError(401, "You can only reset your own challenge!"));
    }
    challenge.progress = 0;
    await challenge.save();
    return res.status(200).json({ success: true, challenge });
  } catch (error) {
    next(error);
  }
};
