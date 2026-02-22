import request from "supertest";
import { app } from "../../app.js";
import { describe, beforeEach, it, expect, vi } from "vitest";
import { resetDB } from "../../config/db.js";
import { EMAIL_MESSAGE } from "../../features/auth/auth-service.js";
import crypto from "crypto";

const TEST_OTP = "123456";

vi.mock("../../utils/generateOTP", () => ({
  generateOTP: vi.fn(() => ({
    otp: TEST_OTP,
    hashedOTP: crypto.createHash("sha256").update(TEST_OTP).digest("hex"),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
  })),
}));

describe("Auth integration", () => {
  const signupData = { email: "test@example.com", username: "testuser" };
  beforeEach(async () => {
    await resetDB();
    vi.clearAllMocks();
  });

  it("signup creates a new user", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send(signupData);
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
    const token = res.body?.message?.data;
    expect(typeof token).toBe("string");
  });

  it("sets password after verification", async () => {
    await request(app).post("/api/v1/auth/signup").send(signupData);
    const verifyRes = await request(app)
      .post("/api/v1/verify-email")
      .send({ email: signupData.email, otp: TEST_OTP });

    const token = verifyRes.body?.message?.data;
    expect(typeof token).toBe("string");

    const setPwdRes = await request(app)
      .post("/api/v1/auth/set-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "newpassword" });

    expect(setPwdRes.status).toBe(200);
    expect(setPwdRes.body).toEqual({
      success: true,
      message: "Password set successfully",
    });
  });

  it("logs in with newly set password and sets cookies", async () => {
    await request(app).post("/api/v1/auth/signup").send(signupData);
    const verifyRes = await request(app)
      .post("/api/v1/verify-email")
      .send({ email: signupData.email, otp: TEST_OTP });
    const token = verifyRes.body?.message?.data;

    await request(app)
      .post("/api/v1/auth/set-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "newpassword" });

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: signupData.email, password: "newpassword" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toEqual({
      success: true,
      message: "Login successful",
    });

    const cookies = loginRes.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(Array.isArray(cookies)).toBe(true);

    if (Array.isArray(cookies)) {
      const hasRefreshToken = cookies.some(
        (cookie) =>
          cookie.includes("refreshToken=") &&
          cookie.includes("HttpOnly") &&
          cookie.includes("SameSite=Strict"),
      );
      expect(hasRefreshToken).toBe(true);

      const hasAccessToken = cookies.some(
        (cookie) =>
          cookie.includes("accessToken=") && cookie.includes("HttpOnly"),
      );
      expect(hasAccessToken).toBe(true);
    }
  });
});
