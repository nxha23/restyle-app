// api/controller/auth.controller.js

import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { createError } from "../utils/error.js";
// Import the seed function from seedChallenges.js. Adjust the path if needed.
import { seedChallengesForUser } from "../../seedChallenges.js";

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    // Hash the password
    const hashedPassword = bcryptjs.hashSync(password, 10);
    // Create a new user instance
    const newUser = new User({ username, email, password: hashedPassword });
    // Save the new user to the DB
    await newUser.save();

    // Seed challenges for this new user.
    await seedChallengesForUser(newUser._id);

    // Create a token so the user is automatically logged in
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    // Remove the password from the response
    const { password: pass, ...rest } = newUser._doc;
    return res
      .cookie("access_token", token, { httpOnly: true })
      .status(201)
      .json({
        success: true,
        message: "User created successfully!",
        token, // so the frontend can store it
        user: rest,
      });
  } catch (err) {
    next(err);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) {
      return next(createError(404, "User not found!"));
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(createError(401, "Wrong credentials!"));
    }

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    const { password: pass, ...rest } = validUser._doc;
    return res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json({
        success: true,
        token,
        user: rest,
      });
  } catch (err) {
    next(err);
  }
};

export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      const { password, ...rest } = user._doc;
      return res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json({
          success: true,
          token,
          user: rest,
        });
    } else {
      // Create a new user for Google sign-in
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      const newUser = new User({
        username:
          req.body.name.split(" ").join("").toLowerCase() +
          Math.random().toString(36).slice(-4),
        email: req.body.email,
        password: hashedPassword,
        avatar: req.body.photo,
      });
      await newUser.save();

      // Seed challenges for the new Google user.
      await seedChallengesForUser(newUser._id);

      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      const { password, ...rest } = newUser._doc;
      return res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json({
          success: true,
          token,
          user: rest,
        });
    }
  } catch (err) {
    next(err);
  }
};

export const signOut = async (req, res, next) => {
  try {
    res.clearCookie("access_token");
    return res.status(200).json({
      success: true,
      message: "User has been logged out!",
    });
  } catch (err) {
    next(err);
  }
};
