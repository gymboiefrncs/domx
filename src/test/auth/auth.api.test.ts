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
    await resetDB(); // clear tables before each test
    vi.clearAllMocks();
  });

  it("Creates a new user", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send(signupData);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: EMAIL_MESSAGE,
    });
  });

  it("Should verify email with correct OTP", async () => {
    // Signup again in THIS test
    await request(app).post("/api/v1/auth/signup").send(signupData);

    const res = await request(app)
      .post("/api/v1/verify-email")
      .send({ email: signupData.email, otp: "123456" });

    expect(res.status).toBe(200);
  });
});
