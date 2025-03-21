// seedChallenges.js

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Challenge from "./api/models/challenge.model.js"; // Adjust the path if needed

// Default challenge data
export const defaultChallenges = [
  { challengeType: "No new clothes for 30 days!", goal: 30 },
  { challengeType: "Style one clothing item in 5 different ways over a week", goal: 5 },
  { challengeType: "Repair / upcycle 5 items this month", goal: 5 },
];

// This function seeds challenges for a single user.
// The fix: converting the userId (an ObjectId) to a string.
export const seedChallengesForUser = async (userId) => {
  try {
    const challenges = defaultChallenges.map((challenge) => ({
      userRef: userId.toString(), // Convert ObjectId to string to match your schema
      challengeType: challenge.challengeType,
      goal: challenge.goal,
      locked: true,
      progress: 0,
    }));

    return await Challenge.insertMany(challenges);
  } catch (error) {
    console.error("Error seeding challenges for user:", error);
  }
};

// Optional: If you want to seed challenges for all existing users
export const seedAllChallenges = async () => {
  try {
    console.log("Seed all challenges function called.");
  } catch (error) {
    console.error("Error seeding all challenges:", error);
  }
};
