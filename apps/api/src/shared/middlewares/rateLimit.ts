import type { RequestHandler } from "express";
import { RateLimiterMemory, type RateLimiterRes } from "rate-limiter-flexible";
import { config } from "../config.js";

const isProd = config.server.nodeEnv === "production";

interface LimiterOptions {
  keyPrefix: string;
  prodMax: number;
  windowMs: number;
  blockDurationMs?: number;
  message: string;
}

interface SocketLimiterOptions {
  keyPrefix: string;
  prodMax: number;
  windowMs: number;
  blockDurationMs?: number;
  message: string;
}

const createLimiter = (options: LimiterOptions): RequestHandler => {
  const points = isProd ? options.prodMax : 1000;
  const limiter = new RateLimiterMemory({
    keyPrefix: options.keyPrefix,
    points,
    duration: Math.ceil(options.windowMs / 1000),
    ...(options.blockDurationMs && {
      blockDuration: Math.ceil(options.blockDurationMs / 1000),
    }),
  });

  return async (req, res, next) => {
    const key: string | undefined =
      req.user?.userId ?? req.body?.email ?? req.ip;
    console.log("Key:", key);
    if (!key) {
      res
        .status(400)
        .json({ errors: [{ message: "Unable to verify request origin" }] });
      return;
    }

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
    ...(options.blockDurationMs && {
      blockDuration: Math.ceil(options.blockDurationMs / 1000),
    }),
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
  windowMs: 5 * 60 * 1000,
  message: "Too many requests, try again after 10 minutes",
  blockDurationMs: 10 * 60 * 1000,
});

export const loginLimiter: RequestHandler = createLimiter({
  keyPrefix: "auth-login",
  prodMax: 5,
  windowMs: 5 * 60 * 1000,
  message: "Too many requests, try again after 2 minutes",
  blockDurationMs: 2 * 60 * 1000,
});

export const refreshLimiter: RequestHandler = createLimiter({
  keyPrefix: "auth-refresh",
  prodMax: 10,
  windowMs: 2 * 60 * 1000,
  message: "Too many requests, try again after 2 minutes",
  blockDurationMs: 2 * 60 * 1000,
});

export const groupLimiter: RequestHandler = createLimiter({
  keyPrefix: "groups",
  prodMax: 150,
  windowMs: 60 * 1000,
  message: "Too many requests, try again after a minute",
  blockDurationMs: 60 * 1000,
});

export const createGroupLimiter: RequestHandler = createLimiter({
  keyPrefix: "create-group",
  prodMax: 10,
  windowMs: 60 * 1000,
  message: "Too many requests, try again after a minute",
  blockDurationMs: 60 * 1000,
});

export const readPostLimiter: RequestHandler = createLimiter({
  keyPrefix: "read-posts",
  prodMax: 150,
  windowMs: 60 * 1000,
  message: "Too many requests, try again after a minute",
});

export const profileLimiter: RequestHandler = createLimiter({
  keyPrefix: "profile",
  prodMax: 150,
  windowMs: 60 * 1000,
  message: "Too many requests, try again after a minute",
});

export const readProfileLimiter: RequestHandler = createLimiter({
  keyPrefix: "read-profile",
  prodMax: 150,
  windowMs: 60 * 1000,
  message: "Too many requests, try again after a minute",
});

export const deleteProfileLimiter: RequestHandler = createLimiter({
  keyPrefix: "delete-profile",
  prodMax: 2,
  windowMs: 24 * 60 * 60 * 1000,
  message: "Too many requests, try again after a minute",
});

export const verificationLimiter: RequestHandler = createLimiter({
  keyPrefix: "verification",
  prodMax: 2,
  windowMs: 2 * 60 * 1000,
  message: "Too many requests, try again after 2 minutes",
});

export const otpLimiter: RequestHandler = createLimiter({
  keyPrefix: "otp",
  prodMax: 5,
  windowMs: 5 * 60 * 1000,
  message: "Too many requests, try again after 5 minutes",
});

export const wsConnectionLimiter = createSocketLimiter({
  keyPrefix: "ws-connection",
  prodMax: 15,
  windowMs: 60 * 1000,
  message: "Too many connection attempts, try again after a minute",
  blockDurationMs: 3 * 60 * 1000,
});

export const wsWritePostLimiter = createSocketLimiter({
  keyPrefix: "ws-write",
  prodMax: 10,
  windowMs: 10 * 1000,
  message: "You are sending messages too quickly, try again after 20 seconds",
  blockDurationMs: 20 * 1000,
});

export const wsEditPostLimiter = createSocketLimiter({
  keyPrefix: "ws-edit",
  prodMax: 3,
  windowMs: 10 * 1000,
  message: "You are editing messages too quickly, try again after 20 seconds",
  blockDurationMs: 20 * 1000,
});

export const wsDeletePostLimiter = createSocketLimiter({
  keyPrefix: "ws-delete",
  prodMax: 3,
  windowMs: 10 * 1000,
  message: "You are deleting messages too quickly, try again after 20 seconds",
  blockDurationMs: 20 * 1000,
});

export const wsAddMemberLimiter = createSocketLimiter({
  keyPrefix: "ws-add-member",
  prodMax: 15,
  windowMs: 5 * 60 * 1000,
  message: "You are adding members too quickly, try again after 2 minutes",
  blockDurationMs: 2 * 60 * 1000,
});

export const wsAdminActionLimiter = createSocketLimiter({
  keyPrefix: "ws-admin-action",
  prodMax: 20,
  windowMs: 5 * 60 * 1000,
  message:
    "You are performing admin actions too quickly, try again after 2 minutes",
  blockDurationMs: 2 * 60 * 1000,
});

export const wsLeaveGroupLimiter = createSocketLimiter({
  keyPrefix: "ws-leave-group",
  prodMax: 30,
  windowMs: 60 * 1000,
  message: "You are leaving groups too quickly, try again after 2 minutes",
  blockDurationMs: 2 * 60 * 1000,
});

export const wsRenameGroupLimiter = createSocketLimiter({
  keyPrefix: "ws-rename-group",
  prodMax: 3,
  windowMs: 60 * 1000,
  message: "You are renaming groups too quickly, try again after 5 minutes",
  blockDurationMs: 5 * 60 * 1000,
});

export const wsDeleteGroupLimiter = createSocketLimiter({
  keyPrefix: "ws-delete-group",
  prodMax: 3,
  windowMs: 60 * 1000,
  message: "You are deleting groups too quickly, try again after 5 minutes",
  blockDurationMs: 5 * 60 * 1000,
});
