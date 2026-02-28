import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/error.js";
import { JWSInvalid, JWTExpired } from "jose/errors";

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  const isDev = process.env.NODE_ENV === "development";

  if (err instanceof AppError) {
    if (err.logging) {
      console.error(`[${new Date().toISOString()}] ${err.constructor.name}:`, {
        code: err.statusCode,
        context: err.errors,
        stack: isDev ? err.stack : undefined,
        cause: isDev ? err.cause : undefined,
      });
    }
    return res.status(err.statusCode).json({ errors: err.errors });
  }

  // Handle invalid json
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ errors: [{ message: "Invalid JSON payload" }] });
  }

  if (err instanceof JWSInvalid || err instanceof JWTExpired) {
    return res
      .status(401)
      .json({ errors: [{ message: "Invalid or expired token" }] });
  }

  console.error("UNEXPECTED ERROR:", err);
  return res.status(500).json({
    errors: [
      { message: "An unexpected error occurred. Please try again later." },
    ],
  });
};

//TODO: Add Sentry or another error tracking service for better monitoring in production and improve error handling..
