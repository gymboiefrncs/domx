import request from "supertest";
import { app } from "../../app.js";
import { describe, beforeEach, it, expect, vi } from "vitest";
import { EMAIL_MESSAGE } from "../../features/auth/auth-service.js";
import crypto from "crypto";

const TEST_OTP = "123456";
const TEST_PASSWORD = "Newpassword123_";
const signupData = { email: "test@example.com" };

vi.mock("../../utils/generateOTP", () => ({
  generateOTP: vi.fn(() => ({
    otp: TEST_OTP,
    hashedOTP: crypto.createHash("sha256").update(TEST_OTP).digest("hex"),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
  })),
}));

// helpers
const setupVerifiedUser = async () => {
  await request(app).post("/api/v1/auth/signup").send(signupData);
  const verifyRes = await request(app)
    .post("/api/v1/verify-email")
    .send({ email: signupData.email, otp: TEST_OTP });
  const token = verifyRes.body?.message?.data;
  await request(app)
    .post("/api/v1/auth/set-password")
    .set("Authorization", `Bearer ${token}`)
    .send({ password: TEST_PASSWORD });
};

const setupAndLogin = async () => {
  await request(app).post("/api/v1/auth/signup").send(signupData);
  const verifyRes = await request(app)
    .post("/api/v1/verify-email")
    .send({ email: signupData.email, otp: TEST_OTP });

  const token = verifyRes.body?.message?.data;
  await request(app)
    .post("/api/v1/auth/set-password")
    .set("Authorization", `Bearer ${token}`)
    .send({ password: TEST_PASSWORD });

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: signupData.email, password: TEST_PASSWORD });

  const cookies = loginRes.headers["set-cookie"];
  if (!Array.isArray(cookies)) return cookies;

  return cookies as string[];
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
      expect(typeof res.body?.message?.data).toBe("string");
    });

    it("sets password after verification", async () => {
      await request(app).post("/api/v1/auth/signup").send(signupData);

      const verifyRes = await request(app)
        .post("/api/v1/verify-email")
        .send({ email: signupData.email, otp: TEST_OTP });

      const token = verifyRes.body?.message?.data;

      const res = await request(app)
        .post("/api/v1/auth/set-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ password: TEST_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: "Password set successfully",
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
      expect(res.body.errors.message).toBe("Invalid data");
    });
  });

  describe("Set password validation", () => {
    it("rejects password that is too short", async () => {
      const res = await request(app)
        .post("/api/v1/auth/set-password")
        .set("Authorization", "Bearer token")
        .send({ password: "short" });
      expect(res.status).toBe(422);
      expect(res.body.errors.message).toBe("Invalid data");
    });
  });

  describe("Set password edge cases", () => {
    it("should only allow the password to be set once during a race condition", async () => {
      await request(app).post("/api/v1/auth/signup").send(signupData);

      const verifyRes = await request(app)
        .post("/api/v1/verify-email")
        .send({ email: signupData.email, otp: TEST_OTP });
      const token = verifyRes.body?.message?.data;

      const [res1, res2] = await Promise.all([
        request(app)
          .post("/api/v1/auth/set-password")
          .set("Authorization", `Bearer ${token}`)
          .send({ password: TEST_PASSWORD }),
        request(app)
          .post("/api/v1/auth/set-password")
          .set("Authorization", `Bearer ${token}`)
          .send({ password: "test_W2322422" }),
      ]);

      const statuses = [res1.status, res2.status];

      expect(statuses).toContain(200);
      expect(statuses).toContain(400);

      const messages = [res1.body, res2.body];
      expect(messages).toContainEqual({
        success: true,
        message: "Password set successfully",
      });
      expect(messages).toContainEqual({
        success: false,
        message: "Something went wrong. Please try again later",
      });
    });
  });

  describe("Login validation", () => {
    it("rejects invalid email format", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "notanemail", password: TEST_PASSWORD });
      expect(res.status).toBe(422);
      expect(res.body.errors.message).toBe("Invalid data");
    });
  });

  describe("Login edge cases", () => {
    const EXPECTED_ERROR = "Invalid credentials or account not verified";

    it("rejects wrong password", async () => {
      await setupVerifiedUser();

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupData.email, password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(res.body.errors.message).toBe(EXPECTED_ERROR);
    });

    it("rejects unverified account", async () => {
      await request(app).post("/api/v1/auth/signup").send(signupData);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupData.email, password: TEST_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.errors.message).toBe(EXPECTED_ERROR);
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
      expect(res.body.errors.message).toBe(EXPECTED_ERROR);
    });

    it("rejects non-existent email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupData.email, password: TEST_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.errors.message).toBe(EXPECTED_ERROR);
    });
  });

  describe("Refresh tokens", async () => {
    it("returns new cookies with valid refresh token", async () => {
      const cookies = await setupAndLogin();
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookies as string[]);

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
      expect(res.body.errors[0].message).toBe("Invalid or expired token");
    });

    it("rejects a tampered refresh token", async () => {
      const cookies = await setupAndLogin();
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set(
          "Cookie",
          (cookies as string[])?.map((c) =>
            c.replace(/refreshToken=([^;]+)/, "refreshToken=invalidtoken"),
          ),
        );

      expect(res.status).toBe(401);
      expect(res.body.errors[0].message).toBe("Invalid or expired token");
    });

    it("rejects a replayed refresh token", async () => {
      const cookies = await setupAndLogin();

      await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookies as string[]);

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookies as string[]);

      expect(res.status).toBe(401);
      expect(res.body.errors.message).toBe(
        "Session expired, please login again",
      );
    });

    it("rejects refresh after logout", async () => {
      const cookies = await setupAndLogin();

      await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", cookies as string[]);

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookies as string[]);

      expect(res.status).toBe(401);
    });
  });
});
