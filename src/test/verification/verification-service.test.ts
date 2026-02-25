import { describe, it, vi, beforeEach, expect } from "vitest";
import { pool } from "../../config/db.js";
import crypto from "crypto";
import {
  OTP_MESSAGE_FAIL,
  OTP_MESSAGE_SUCCESS,
  RESEND_OTP_MESSAGE,
  resendOtp,
  validateOtp,
} from "../../features/verification/verification-service.js";
import { COOLDOWN_MESSAGE } from "../../features/auth/auth-service.js";

const TEST_OTP = "123456";

const hashOTP = () => {
  return crypto.createHash("sha256").update(TEST_OTP).digest("hex");
};
vi.mock("../../utils/generateOTP", () => ({
  generateOTP: vi.fn(() => ({
    otp: TEST_OTP,
    hashedOTP: crypto.createHash("sha256").update(TEST_OTP).digest("hex"),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
  })),
}));
vi.mock(
  "../../features/verification/verification-helpers/generateSetPasswordToken.ts",
  () => ({
    generateSetPasswordToken: vi.fn().mockResolvedValue("mocked_token"),
  }),
);

const TEST_EMAIL = "test@example.com";
describe("Verification Service", () => {
  let userId: number;
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    // Insert a test user
    const userRes = await pool.query(
      "INSERT INTO users (email, password, is_verified) VALUES ($1, $2, $3) RETURNING id",
      [TEST_EMAIL, null, false],
    );
    userId = userRes.rows[0].id;
  });

  describe("Validate OTP", () => {
    it("validates a correct OTP, marks user verified and returns a token", async () => {
      const hashedOTP = hashOTP();

      await pool.query(
        "INSERT INTO email_verification (user_id, otp_hash, expires_at) VALUES ($1, $2, $3)",
        [userId, hashedOTP, new Date(Date.now() + 2 * 60 * 1000)],
      );

      const validationRes = await validateOtp({
        email: TEST_EMAIL,
        otp: TEST_OTP,
      });

      if (validationRes.ok) {
        expect(validationRes.ok).toBe(true);
        expect(validationRes.data).toBe("mocked_token");
        expect(validationRes.message).toBe(OTP_MESSAGE_SUCCESS);
      }

      const userRecord = await pool.query(
        "SELECT is_verified FROM users WHERE email = $1",
        [TEST_EMAIL],
      );
      const otpRecord = await pool.query(
        "SELECT used_at FROM email_verification WHERE user_id = $1",
        [userId],
      );

      expect(otpRecord.rows[0].used_at).toBeDefined();
      expect(userRecord.rows[0].is_verified).toBe(true);
    });

    it("fails validation with an incorrect OTP", async () => {
      const hashedOTP = hashOTP();

      await pool.query(
        "INSERT INTO email_verification (user_id, otp_hash, expires_at) VALUES ($1, $2, $3)",
        [userId, hashedOTP, new Date(Date.now() + 2 * 60 * 1000)],
      );

      const validationRes = await validateOtp({
        email: TEST_EMAIL,
        otp: "000000",
      });

      if (!validationRes.ok) {
        expect(validationRes.ok).toBe(false);
        expect(validationRes.reason).toBe(OTP_MESSAGE_FAIL);
      }
      const userRecord = await pool.query(
        "SELECT is_verified FROM users WHERE email = $1",
        [TEST_EMAIL],
      );

      expect(userRecord.rows[0].is_verified).toBe(false);
    });

    it("fails validation if OTP doesn't exist", async () => {
      const validationRes = await validateOtp({
        email: TEST_EMAIL,
        otp: "000000",
      });

      if (!validationRes.ok) {
        expect(validationRes.ok).toBe(false);
        expect(validationRes.reason).toBe(OTP_MESSAGE_FAIL);
      }
      const userRecord = await pool.query(
        "SELECT is_verified FROM users WHERE email = $1",
        [TEST_EMAIL],
      );

      expect(userRecord.rows[0].is_verified).toBe(false);
    });

    it("fails validation with an expired OTP", async () => {
      const hashedOTP = hashOTP();
      await pool.query(
        "INSERT INTO email_verification (user_id, otp_hash, expires_at) VALUES ($1, $2, $3)",
        [userId, hashedOTP, new Date(Date.now() - 60 * 1000)],
      );

      const validationRes = await validateOtp({
        email: TEST_EMAIL,
        otp: TEST_OTP,
      });

      if (!validationRes.ok) {
        expect(validationRes.ok).toBe(false);
        expect(validationRes.reason).toBe(OTP_MESSAGE_FAIL);
      }
    });

    it("fails validation if OTP has already been used", async () => {
      const hashedOTP = hashOTP();

      await pool.query(
        "INSERT INTO email_verification (user_id, otp_hash, expires_at, used_at) VALUES ($1, $2, $3, $4)",
        [
          userId,
          hashedOTP,
          new Date(Date.now() + 2 * 60 * 1000),
          new Date(Date.now()),
        ],
      );

      const validationRes = await validateOtp({
        email: TEST_EMAIL,
        otp: TEST_OTP,
      });
      if (!validationRes.ok) {
        expect(validationRes.ok).toBe(false);
        expect(validationRes.reason).toBe(OTP_MESSAGE_FAIL);
      }
    });

    it("it increments retry count on invalid OTP and invalidates after 5 attempts", async () => {
      const hashedOTP = hashOTP();

      await pool.query(
        "INSERT INTO email_verification (user_id, otp_hash, expires_at) VALUES ($1, $2, $3)",
        [userId, hashedOTP, new Date(Date.now() + 2 * 60 * 1000)],
      );

      for (let i = 0; i < 5; i++) {
        const validationRes = await validateOtp({
          email: TEST_EMAIL,
          otp: "000000",
        });
        if (!validationRes.ok) {
          expect(validationRes.ok).toBe(false);
          expect(validationRes.reason).toBe(OTP_MESSAGE_FAIL);
        }
      }
      const retries = await pool.query(
        "SELECT retries FROM email_verification WHERE user_id = $1",
        [userId],
      );
      expect(retries.rows[0].retries).toBe(5);
    });
  });

  describe("Resend OTP", () => {
    it("resends OTP to an unverified user", async () => {
      const res = await resendOtp(TEST_EMAIL);
      expect(res.ok).toBe(true);
      expect(res.message).toBe(RESEND_OTP_MESSAGE);

      const otpRow = await pool.query(
        "SELECT otp_hash, used_at FROM email_verification WHERE user_id = $1",
        [userId],
      );
      expect(otpRow.rows[0].otp_hash).toBeDefined();
      expect(otpRow.rows[0].used_at).toBeNull();
    });

    it("prevents resending OTP too soon (cooldown)", async () => {
      await resendOtp(TEST_EMAIL);

      const res = await resendOtp(TEST_EMAIL);
      expect(res.ok).toBe(true);
      expect(res.message).toBe(COOLDOWN_MESSAGE);
    });

    it("does not resend OTP if user is already verified", async () => {
      await pool.query("UPDATE users SET is_verified = true WHERE id = $1", [
        userId,
      ]);

      const res = await resendOtp(TEST_EMAIL);
      expect(res.ok).toBe(true);
      expect(res.message).toBe(RESEND_OTP_MESSAGE);
    });

    it("returns success even if email does not exist", async () => {
      const res = await resendOtp("unknown@example.com");
      expect(res.ok).toBe(true);
      expect(res.message).toBe(RESEND_OTP_MESSAGE);
    });
  });
});
