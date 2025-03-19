// seedChallenges.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Challenge from "./api/models/challenge.model.js";
import User from "./api/models/user.model.js"; // Adjust path if needed

const MONGODB_URI = process.env.MONGO; // Uses your env variable

const defaultChallenges = [
  { challengeType: "No new clothes for 30 days!", goal: 30 },
  { challengeType: "Style one clothing item in 5 different ways over a week", goal: 5 },
  { challengeType: "Repair / upcycle 5 items this month", goal: 5 },
];

const seedChallengesForUser = async (userId) => {
  const challenges = defaultChallenges.map((challenge) => ({
    userRef: userId,
    challengeType: challenge.challengeType,
    goal: challenge.goal,
    locked: true,
    progress: 0,
  }));
  return await Challenge.insertMany(challenges);
};

const seedAllChallenges = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Option: Seed challenges for all users in your database.
    const users = await User.find({});
    for (const user of users) {
      // Check if this user already has at least one challenge.
      const existing = await Challenge.findOne({ userRef: user._id });
      if (!existing) {
        await seedChallengesForUser(user._id);
        console.log(`Seeded challenges for user: ${user.email}`);
      } else {
        console.log(`User ${user.email} already has challenges.`);
      }
    }

    console.log("Seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding challenges:", error);
    process.exit(1);
  }
};

seedAllChallenges();
