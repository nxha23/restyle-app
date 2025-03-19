// verifyUser.js
import jwt from "jsonwebtoken";
import { createError } from "./error.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(createError(401, "Unauthorized: No token provided"));
  }

  const token = authHeader.split(" ")[1];
  // Verify token (Firebase or custom)
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(createError(403, "Forbidden: Invalid token"));
    req.user = user;
    next();
  });
};