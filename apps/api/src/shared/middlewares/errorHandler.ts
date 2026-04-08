import type { ErrorRequestHandler } from "express";
import { AppError } from "../error.js";
import { JWSInvalid, JWTExpired } from "jose/errors";
import { config } from "../config.js";
import { ZodError } from "zod";

type ErrorWithStatus = Error & { status?: number; type?: string };
type PgLikeError = Error & {
  code?: string;
  detail?: string;
  constraint?: string;
  column?: string;
  table?: string;
};

const isBodyParserSyntaxError = (err: unknown): err is ErrorWithStatus => {
  return (
    err instanceof SyntaxError &&
    typeof (err as ErrorWithStatus).status === "number" &&
    (err as ErrorWithStatus).status === 400
  );
};

const isPayloadTooLargeError = (err: unknown): err is ErrorWithStatus => {
  return (
    err instanceof Error &&
    typeof (err as ErrorWithStatus).status === "number" &&
    (err as ErrorWithStatus).status === 413
  );
};

const mapPgError = (err: PgLikeError): AppError | null => {
  if (!err.code) return null;

  switch (err.code) {
    case "22P02":
      return new (class extends AppError {
        readonly statusCode = 400;
      })("Invalid request parameter", true, { dbCode: err.code });
    case "22001":
      return new (class extends AppError {
        readonly statusCode = 422;
      })("One or more field values are too long", true, { dbCode: err.code });
    case "23502":
      return new (class extends AppError {
        readonly statusCode = 422;
      })("A required field is missing", true, {
        dbCode: err.code,
        column: err.column,
        table: err.table,
      });
    case "23503":
      return new (class extends AppError {
        readonly statusCode = 422;
      })("A referenced resource was not found", true, {
        dbCode: err.code,
        detail: err.detail,
      });
    case "23505":
      return new (class extends AppError {
        readonly statusCode = 409;
      })("A resource with this value already exists", true, {
        dbCode: err.code,
        constraint: err.constraint,
      });
    default:
      return null;
  }
};

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  _next,
) => {
  const isDev = config.server.nodeEnv === "development";

  const logError = (label: string, errorToLog: unknown): void => {
    console.error(`[${new Date().toISOString()}] ${label}:`, {
      method: req.method,
      path: req.originalUrl,
      stack:
        isDev && errorToLog instanceof Error ? errorToLog.stack : undefined,
      error: errorToLog,
    });
  };

  if (err instanceof AppError) {
    if (err.logging) {
      console.error(`[${new Date().toISOString()}] ${err.constructor.name}:`, {
        code: err.statusCode,
        method: req.method,
        path: req.originalUrl,
        context: err.errors,
        stack: isDev ? err.stack : undefined,
        cause: isDev ? err.cause : undefined,
      });
    }
    return res.status(err.statusCode).json({ errors: err.errors });
  }

  if (isBodyParserSyntaxError(err)) {
    return res
      .status(400)
      .json({ errors: [{ message: "Invalid JSON payload" }] });
  }

  if (isPayloadTooLargeError(err)) {
    return res.status(413).json({ errors: [{ message: "Payload too large" }] });
  }

  if (err instanceof JWSInvalid || err instanceof JWTExpired) {
    return res
      .status(401)
      .json({ errors: [{ message: "Invalid or expired token" }] });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      errors: [
        {
          message: "Invalid data",
          context: {
            fields: err.flatten().fieldErrors,
          },
        },
      ],
    });
  }

  const mappedPgError = mapPgError(err as PgLikeError);
  if (mappedPgError) {
    if (mappedPgError.logging) {
      logError("DatabaseError", err);
    }
    return res.status(mappedPgError.statusCode).json({
      errors: mappedPgError.errors,
    });
  }

  logError("UnexpectedError", err);
  return res.status(500).json({
    errors: [
      { message: "An unexpected error occurred. Please try again later." },
    ],
  });
};
