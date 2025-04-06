// seedChallenges.js

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Challenge from "./api/models/challenge.model.js"; 

// Default challenge data
export const defaultChallenges = [
  { challengeType: "No new clothes for 30 days!", goal: 30 },
  { challengeType: "Style one clothing item in 5 different ways over a week", goal: 5 },
  { challengeType: "Repair / upcycle 5 items this month", goal: 5 },
];

 
// seeds challenges for a single user.
export const seedChallengesForUser = async (userId) => {
  try {
    const challenges = defaultChallenges.map((challenge) => ({
      userRef: userId.toString(), 
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

export const seedAllChallenges = async () => {
  try {
    console.log("Seed all challenges function called.");
  } catch (error) {
    console.error("Error seeding all challenges:", error);
  }
};
