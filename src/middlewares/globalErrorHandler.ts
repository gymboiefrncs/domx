import type { ErrorRequestHandler } from "express";
import { prettifyError, ZodError } from "zod";
import { AppError } from "../utils/error.js";

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  const isDev = process.env.NODE_ENV === "development";

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: isDev ? err.stack : undefined,
    });
  } else if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      status: "fail",
      message: isDev ? prettifyError(err) : "Validation Error",
      issues: err.issues,
    });
  } else {
    res.status(500).json({
      success: false,
      status: "error",
      message: isDev ? err.message : "Internal Server Error",
    });
  }
};
