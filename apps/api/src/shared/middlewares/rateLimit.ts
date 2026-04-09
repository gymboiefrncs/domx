import type { NextFunction, Request, RequestHandler, Response } from "express";
import { RateLimiterMemory, type RateLimiterRes } from "rate-limiter-flexible";
import { config } from "../config.js";

const isProd = config.server.nodeEnv === "production";

type LimiterOptions = {
  keyPrefix: string;
  prodMax: number;
  windowMs: number;
  message: string;
};

type SocketLimiterOptions = {
  keyPrefix: string;
  prodMax: number;
  windowMs: number;
};

const createLimiter = (options: LimiterOptions): RequestHandler => {
  const points = isProd ? options.prodMax : 1000;

  const limiter = new RateLimiterMemory({
    keyPrefix: options.keyPrefix,
    points,
    duration: Math.ceil(options.windowMs / 1000),
  });

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const key = req.user?.userId ?? req.ip ?? "unknown";

    try {
      await limiter.consume(key);
      next();
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "msBeforeNext" in error
      ) {
        const retryMs = (error as RateLimiterRes).msBeforeNext;
        const retryAfter = Math.max(1, Math.ceil(retryMs / 1000));

        res.setHeader("Retry-After", retryAfter.toString());
        res.status(429).json({
          errors: [
            {
              message: options.message,
              context: { retryAfter },
            },
          ],
        });
        return;
      }

      next(error);
    }
  };
};

const createSocketLimiter = (
  options: SocketLimiterOptions,
): RateLimiterMemory => {
  const points = isProd ? options.prodMax : 1000;

  return new RateLimiterMemory({
    keyPrefix: options.keyPrefix,
    points,
    duration: Math.ceil(options.windowMs / 1000),
  });
};

export const getRetryAfterSeconds = (error: unknown): number | null => {
  if (
    typeof error !== "object" ||
    error === null ||
    !("msBeforeNext" in error)
  ) {
    return null;
  }

  const retryMs = (error as RateLimiterRes).msBeforeNext;
  return Math.max(1, Math.ceil(retryMs / 1000));
};

export const signupLimiter: RequestHandler = createLimiter({
  keyPrefix: "auth-signup",
  prodMax: 3,
  windowMs: 30 * 60 * 1000,
  message: "Too many requests, please try again after 30 minutes",
});

export const loginLimiter: RequestHandler = createLimiter({
  keyPrefix: "auth-login",
  prodMax: 5,
  windowMs: 5 * 60 * 1000,
  message: "Too many requests, please try again after 5 minutes",
});

export const refreshLimiter: RequestHandler = createLimiter({
  keyPrefix: "auth-refresh",
  prodMax: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests, please try again after 15 minutes",
});

export const groupLimiter: RequestHandler = createLimiter({
  keyPrefix: "groups",
  prodMax: 120,
  windowMs: 60 * 1000,
  message: "Too many requests, please try again in a minute",
});

export const createGroupLimiter: RequestHandler = createLimiter({
  keyPrefix: "create-group",
  prodMax: 5,
  windowMs: 30 * 60 * 1000,
  message: "Too many requests, please try again in 30 minutes",
});

export const postLimiter: RequestHandler = createLimiter({
  keyPrefix: "posts",
  prodMax: 120,
  windowMs: 60 * 1000,
  message: "Too many requests, please try again in a minute",
});

export const wsConnectionLimiter = createSocketLimiter({
  keyPrefix: "ws-connection",
  prodMax: 20,
  windowMs: 60 * 1000,
});

export const wsWritePostLimiter = createSocketLimiter({
  keyPrefix: "ws-write",
  prodMax: 15,
  windowMs: 60 * 1000,
});

export const profileLimiter: RequestHandler = createLimiter({
  keyPrefix: "profile",
  prodMax: 120,
  windowMs: 60 * 1000,
  message: "Too many requests, please try again in a minute",
});

export const verificationLimiter: RequestHandler = createLimiter({
  keyPrefix: "verification",
  prodMax: 2,
  windowMs: 3 * 60 * 1000,
  message: "Too many requests, please try again after 3 minutes",
});
