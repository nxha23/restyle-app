// api/utils/error.js

// Creates a normal Error object with a statusCode
export function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Global error handler used by Express at the end of all routes
export function globalErrorHandler(err, req, res, next) {
  console.error("Global error handler:", err);

  // If err.statusCode is set, use it, otherwise default to 500
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
  });
}
