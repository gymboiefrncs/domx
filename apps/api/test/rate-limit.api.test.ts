import type { RequestHandler } from "express";
import { describe, expect, it, vi } from "vitest";

type LoadedRateLimitModule =
  typeof import("@api/shared/middlewares/rateLimit.js");

const loadRateLimitModule = async (): Promise<LoadedRateLimitModule> => {
  vi.resetModules();
  vi.doMock("@api/shared/config.js", () => ({
    config: {
      server: {
        nodeEnv: "production",
      },
    },
  }));

  return import("@api/shared/middlewares/rateLimit.js");
};

const runLimiterUntilBlocked = async (
  limiter: RequestHandler,
  maxAllowed: number,
  message: string,
  key: string,
): Promise<void> => {
  const req = {
    ip: key,
    user: { userId: key },
  } as unknown as Parameters<RequestHandler>[0];

  let statusCode: number | null = null;
  let headerValue: string | null = null;
  let payload: unknown = null;

  const res = {
    setHeader: (name: string, value: string) => {
      if (name === "Retry-After") {
        headerValue = value;
      }
    },
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (body: unknown) => {
      payload = body;
      return res;
    },
  } as unknown as Parameters<RequestHandler>[1];

  const next = vi.fn();

  for (let i = 0; i < maxAllowed; i++) {
    await limiter(req, res, next);
  }

  expect(next).toHaveBeenCalledTimes(maxAllowed);

  await limiter(req, res, next);

  expect(statusCode).toBe(429);
  expect(headerValue).toBeTruthy();
  expect(payload).toEqual({
    errors: [
      {
        message,
        context: {
          retryAfter: expect.any(Number),
        },
      },
    ],
  });
};

describe("Rate limits across all API modules", () => {
  it("enforces auth module limiters", async () => {
    const { signupLimiter, loginLimiter, refreshLimiter } =
      await loadRateLimitModule();

    await runLimiterUntilBlocked(
      signupLimiter,
      3,
      "Too many requests, please try again after 30 minutes",
      "signup-user",
    );
    await runLimiterUntilBlocked(
      loginLimiter,
      5,
      "Too many requests, please try again after 5 minutes",
      "login-user",
    );
    await runLimiterUntilBlocked(
      refreshLimiter,
      10,
      "Too many requests, please try again after 15 minutes",
      "refresh-user",
    );
  });

  it("enforces verification module limiter", async () => {
    const { verificationLimiter } = await loadRateLimitModule();

    await runLimiterUntilBlocked(
      verificationLimiter,
      2,
      "Too many requests, please try again after 3 minutes",
      "verification-user",
    );
  });

  it("enforces groups module limiters", async () => {
    const { groupLimiter, createGroupLimiter } = await loadRateLimitModule();

    await runLimiterUntilBlocked(
      groupLimiter,
      120,
      "Too many requests, please try again in a minute",
      "group-user",
    );
    await runLimiterUntilBlocked(
      createGroupLimiter,
      5,
      "Too many requests, please try again in 30 minutes",
      "create-group-user",
    );
  });

  it("enforces posts and profile module limiters", async () => {
    const { postLimiter, profileLimiter } = await loadRateLimitModule();

    await runLimiterUntilBlocked(
      postLimiter,
      120,
      "Too many requests, please try again in a minute",
      "post-user",
    );
    await runLimiterUntilBlocked(
      profileLimiter,
      120,
      "Too many requests, please try again in a minute",
      "profile-user",
    );
  });

  it("enforces websocket connection and write limiters", async () => {
    const { wsConnectionLimiter, wsWritePostLimiter, getRetryAfterSeconds } =
      await loadRateLimitModule();

    for (let i = 0; i < 20; i++) {
      await wsConnectionLimiter.consume("socket-ip");
    }
    await expect(
      wsConnectionLimiter.consume("socket-ip"),
    ).rejects.toMatchObject({
      msBeforeNext: expect.any(Number),
    });

    for (let i = 0; i < 15; i++) {
      await wsWritePostLimiter.consume("socket-user");
    }

    try {
      await wsWritePostLimiter.consume("socket-user");
    } catch (error) {
      expect(getRetryAfterSeconds(error)).toBeGreaterThan(0);
      return;
    }

    throw new Error("Expected wsWritePostLimiter to block after limit");
  });
});
