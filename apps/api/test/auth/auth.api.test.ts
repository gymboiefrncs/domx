import request from "supertest";
import { app } from "@api/app.js";
import { describe, beforeEach, it, expect, vi } from "vitest";
import { VERIFICATION_SUCCESS } from "@api/features/verification/verification.constants.js";
import crypto from "crypto";

const TEST_OTP = "123456";
const TEST_PASSWORD = "Newpassword123_";
const TEST_USERNAME = "testuser";
const signupData = { email: "test@example.com" };
const INFO_SET_SUCCESS_MESSAGE = "Information set successfully";
const INFO_SET_FAILED_MESSAGE = "Failed to set information";
const EMAIL_MESSAGE = VERIFICATION_SUCCESS.EMAIL_SENT;
const OTP_MESSAGE_SUCCESS = VERIFICATION_SUCCESS.OTP_VERIFIED;

vi.mock("@api/features/auth/auth-helpers/generateOTP.js", () => ({
  generateOTP: vi.fn(() => ({
    otp: TEST_OTP,
    hashedOTP: crypto.createHash("sha256").update(TEST_OTP).digest("hex"),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
  })),
}));

const requireCookies = (
  value: string | string[] | undefined,
  step: string,
): string[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Expected set-cookie header from ${step}`);
  }

  return value;
};

// helpers
const setupVerifiedUser = async () => {
  await request(app).post("/api/v1/auth/signup").send(signupData);
  const verifyRes = await request(app)
    .post("/api/v1/verify-email")
    .send({ email: signupData.email, otp: TEST_OTP });
  const verifyCookies = requireCookies(
    verifyRes.headers["set-cookie"],
    "verify-email",
  );
  await request(app)
    .post("/api/v1/auth/set-info")
    .set("Cookie", verifyCookies)
    .send({ password: TEST_PASSWORD, username: TEST_USERNAME });
};

const setupAndLogin = async (): Promise<string[]> => {
  await request(app).post("/api/v1/auth/signup").send(signupData);
  const verifyRes = await request(app)
    .post("/api/v1/verify-email")
    .send({ email: signupData.email, otp: TEST_OTP });

  const verifyCookies = requireCookies(
    verifyRes.headers["set-cookie"],
    "verify-email",
  );
  await request(app)
    .post("/api/v1/auth/set-info")
    .set("Cookie", verifyCookies)
    .send({ password: TEST_PASSWORD, username: TEST_USERNAME });

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: signupData.email, password: TEST_PASSWORD });

  return requireCookies(loginRes.headers["set-cookie"], "auth/login");
};

describe("Auth API", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("Auth flow", () => {
    it("signup creates a new user", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send(signupData);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ success: true, message: EMAIL_MESSAGE });
    });

    it("verifies email with correct OTP", async () => {
      await request(app).post("/api/v1/auth/signup").send(signupData);

      const res = await request(app)
        .post("/api/v1/verify-email")
        .send({ email: signupData.email, otp: TEST_OTP });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(OTP_MESSAGE_SUCCESS);
      expect(Array.isArray(res.headers["set-cookie"])).toBe(true);
    });

    it("sets info after verification", async () => {
      await request(app).post("/api/v1/auth/signup").send(signupData);

      const verifyRes = await request(app)
        .post("/api/v1/verify-email")
        .send({ email: signupData.email, otp: TEST_OTP });

      const verifyCookies = requireCookies(
        verifyRes.headers["set-cookie"],
        "verify-email",
      );

      const res = await request(app)
        .post("/api/v1/auth/set-info")
        .set("Cookie", verifyCookies)
        .send({ password: TEST_PASSWORD, username: TEST_USERNAME });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: INFO_SET_SUCCESS_MESSAGE,
      });
    });

    it("logs in and sets HttpOnly cookies", async () => {
      await setupVerifiedUser();

      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupData.email, password: TEST_PASSWORD });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toEqual({
        success: true,
        message: "Login successful",
      });

      const cookies = loginRes.headers["set-cookie"];
      if (Array.isArray(cookies)) {
        expect(
          cookies.some(
            (c) =>
              c.includes("refreshToken=") &&
              c.includes("HttpOnly") &&
              c.includes("SameSite=Strict"),
          ),
        ).toBe(true);
        expect(
          cookies.some(
            (c) =>
              c.includes("refreshToken=") &&
              c.includes("HttpOnly") &&
              c.includes("SameSite=Strict"),
          ),
        ).toBe(true);
      }
    });
  });

  describe("Signup validation", () => {
    it("rejects invalid email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "invalidemail", username: "user" });
      expect(res.status).toBe(422);
      expect(res.body.errors[0].message).toBe("Invalid data");
    });
  });

  describe("Set info validation", () => {
    it("rejects password that is too short", async () => {
      const res = await request(app)
        .post("/api/v1/auth/set-info")
        .set("Authorization", "Bearer token")
        .send({ password: "short", username: TEST_USERNAME });
      expect(res.status).toBe(422);
      expect(res.body.errors[0].message).toBe("Invalid data");
    });
    it("rejects invalid username", async () => {
      const res = await request(app)
        .post("/api/v1/auth/set-info")
        .set("Authorization", "Bearer token")
        .send({ password: TEST_PASSWORD, username: "ab+" });
      expect(res.status).toBe(422);
      expect(res.body.errors[0].message).toBe("Invalid data");
    });
  });

  describe("Set info edge cases", () => {
    it("should only allow the info to be set once during a race condition", async () => {
      await request(app).post("/api/v1/auth/signup").send(signupData);

      const verifyRes = await request(app)
        .post("/api/v1/verify-email")
        .send({ email: signupData.email, otp: TEST_OTP });
      const verifyCookies = requireCookies(
        verifyRes.headers["set-cookie"],
        "verify-email",
      );

      const [res1, res2] = await Promise.all([
        request(app)
          .post("/api/v1/auth/set-info")
          .set("Cookie", verifyCookies)
          .send({ username: TEST_USERNAME, password: TEST_PASSWORD }),
        request(app)
          .post("/api/v1/auth/set-info")
          .set("Cookie", verifyCookies)
          .send({ username: TEST_USERNAME, password: "test_W2322422" }),
      ]);

      const statuses = [res1.status, res2.status];

      expect(statuses).toContain(200);
      expect(statuses).toContain(400);

      const messages = [res1.body, res2.body];
      expect(messages).toContainEqual({
        success: true,
        message: INFO_SET_SUCCESS_MESSAGE,
      });
      expect(messages).toContainEqual({
        success: false,
        message: INFO_SET_FAILED_MESSAGE,
      });
    });
  });

  describe("Login validation", () => {
    it("rejects invalid email format", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "notanemail", password: TEST_PASSWORD });
      expect(res.status).toBe(422);
      expect(res.body.errors[0].message).toBe("Invalid data");
    });
  });

  describe("Login edge cases", () => {
    const EXPECTED_ERROR = "Invalid credentials";

    it("rejects wrong password", async () => {
      await setupVerifiedUser();

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupData.email, password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(res.body.errors[0].message).toBe(EXPECTED_ERROR);
    });

    it("rejects unverified account", async () => {
      await request(app).post("/api/v1/auth/signup").send(signupData);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupData.email, password: TEST_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.errors[0].message).toBe(EXPECTED_ERROR);
    });

    it("rejects account with no password set", async () => {
      await request(app).post("/api/v1/auth/signup").send(signupData);

      await request(app)
        .post("/api/v1/verify-email")
        .send({ email: signupData.email, otp: TEST_OTP });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupData.email, password: TEST_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.errors[0].message).toBe(EXPECTED_ERROR);
    });

    it("rejects non-existent email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupData.email, password: TEST_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.errors[0].message).toBe(EXPECTED_ERROR);
    });
  });

  describe("Refresh tokens", async () => {
    it("returns new cookies with valid refresh token", async () => {
      const cookies = await setupAndLogin();
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: "Token refreshed" });

      const newCookies = res.headers["set-cookie"];
      if (Array.isArray(newCookies)) {
        expect(
          newCookies.some(
            (c) =>
              c.includes("refreshToken=") &&
              c.includes("HttpOnly") &&
              c.includes("SameSite=Strict"),
          ),
        ).toBe(true);
        expect(
          newCookies.some(
            (c) =>
              c.includes("refreshToken=") &&
              c.includes("HttpOnly") &&
              c.includes("SameSite=Strict"),
          ),
        ).toBe(true);
      }
    });

    it("rejects request with no refresh token", async () => {
      const res = await request(app).post("/api/v1/auth/refresh");

      expect(res.status).toBe(401);
      expect(res.body.errors[0].message).toBe("Invalid refresh token");
    });

    it("rejects a tampered refresh token", async () => {
      const cookies = await setupAndLogin();
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set(
          "Cookie",
          cookies.map((c) =>
            c.replace(/refreshToken=([^;]+)/, "refreshToken=invalidtoken"),
          ),
        );

      expect(res.status).toBe(401);
      expect(res.body.errors[0].message).toBe("Invalid or expired token");
    });

    it("rejects a replayed refresh token", async () => {
      const cookies = await setupAndLogin();

      await request(app).post("/api/v1/auth/refresh").set("Cookie", cookies);

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookies);

      expect(res.status).toBe(401);
      expect(res.body.errors[0].message).toBe(
        "Session expired, please login again",
      );
    });

    it("rejects refresh after logout", async () => {
      const cookies = await setupAndLogin();

      await request(app).post("/api/v1/auth/logout").set("Cookie", cookies);

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookies);

      expect(res.status).toBe(401);
    });
  });
});
