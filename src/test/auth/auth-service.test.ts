import { describe, vi, it, expect, beforeEach, afterEach } from "vitest";
import { registerUser } from "../../features/auth/auth-service.js";
import { pool } from "../../config/db.js";
import { fetchUserByEmail } from "../../features/auth/auth-model.js";
import {
  EMAIL_MESSAGE,
  COOLDOWN_MESSAGE,
} from "../../features/auth/auth-service.js";

vi.mock("../../utils/sendEmail", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendAlreadyRegisteredEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("Auth integration - Signup", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================== NEW USER ============================
  it("should create a new user with correct data", async () => {
    const signupData = {
      email: "sample@gmail.com",
    };

    const result = await registerUser(signupData);
    const user = await fetchUserByEmail(signupData.email);
    const otp = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    expect(result).toEqual({ ok: true, message: EMAIL_MESSAGE });
    expect(otp).toBeDefined();
    expect(user).toMatchObject({
      email: signupData.email,
      is_verified: false,
      role: "user",
    });
  });

  // =========================== VERIFIED USER ============================
  it("should not create a new user if email is already verified", async () => {
    const signupData = {
      email: "verified@example.com",
    };

    // pre-insert a verified user
    await pool.query(
      "INSERT INTO users (email, password, is_verified) VALUES ($1, $2, $3)",
      [signupData.email, "hashed_pw", true],
    );

    // sign up again with the same email
    const result = await registerUser({
      ...signupData,
    });

    const user = await fetchUserByEmail(signupData.email);

    expect(user).toBeDefined();
    expect(user?.email).toBe(signupData.email); // should not update email
    expect(result).toEqual({ ok: true, message: EMAIL_MESSAGE });
  });

  // =========================== UNVERIFIED USER & OTP ROTATION ============================
  it("should not rotate OTP if cooldown is active", async () => {
    const signupData = {
      email: "unverified@example.com",
    };

    // Pre-create an unverified user and OTP
    await registerUser(signupData);
    const user = await fetchUserByEmail(signupData.email);
    const firstOtp = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    //  Trigger the cooldown
    const result = await registerUser(signupData);
    const currentOtp = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    expect(result).toEqual({ ok: true, message: COOLDOWN_MESSAGE });
    expect(currentOtp.rows[0].id).toBe(firstOtp.rows[0].id); // OTP should not have rotated
    expect(currentOtp.rows[0].created_at).toEqual(firstOtp.rows[0].created_at); // created_at should be unchanged
  });

  it("should rotate OTP after the 2 minute cooldown expires", async () => {
    const signupData = {
      email: "rotated@example.com",
    };

    await registerUser(signupData);
    const user = await fetchUserByEmail(signupData.email);
    const firstOtp = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    vi.setSystemTime(new Date(Date.now() + 2 * 60 * 1000 + 5000)); // advance time by 2 minutes and 1 second

    const result = await registerUser(signupData); // trigger OTP rotation
    const secondOtp = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    expect(result).toEqual({ ok: true, message: EMAIL_MESSAGE });
    expect(secondOtp.rows[0].id).not.toBe(firstOtp.rows[0].id); // OTP should have rotated
    expect(secondOtp.rows[0].created_at).not.toEqual(
      firstOtp.rows[0].created_at,
    ); // created_at should be updated
  });

  it("should only create one verifitcation token if multiple concurrent signups with the same unverified email", async () => {
    const signupData = {
      email: "concurrent@example.com",
    };

    await registerUser(signupData); // create unverified user

    const user = await fetchUserByEmail(signupData.email);

    // manually set the created_at of the OTP to more than 2 minutes ago to allow OTP rotation
    await pool.query(
      `
      UPDATE email_verification
      SET created_at = NOW() - INTERVAL '3 minutes'
      WHERE user_id = $1
      `,
      [user?.id],
    );

    const [result1, result2] = await Promise.all([
      registerUser(signupData),
      registerUser(signupData),
    ]);

    const messages = [result1.message, result2.message];
    const { rows } = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    /**
     * we cannot guarantee which request will get the lock first
     * so we just check that both possible messages are returned and that only one verification email is sent
     */
    expect(messages).toContain(EMAIL_MESSAGE);
    expect(messages).toContain(COOLDOWN_MESSAGE);
    expect(rows).toHaveLength(1);
  });

  it("should handle real unique constraint (23505) during concurrent signup", async () => {
    const signupData = {
      email: "realrace@example.com",
    };

    // simulate two concurrent signups with the same email
    const [result1, result2] = await Promise.all([
      registerUser(signupData),
      registerUser(signupData),
    ]);

    const users = await pool.query("SELECT * FROM users WHERE email = $1", [
      signupData.email,
    ]);
    const otp = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [users.rows[0].id],
    );

    expect(result1).toEqual({ ok: true, message: EMAIL_MESSAGE });
    expect(result2).toEqual({ ok: true, message: EMAIL_MESSAGE });
    expect(otp.rows).toHaveLength(1); // only one OTP should be created
    expect(users.rows).toHaveLength(1); // should stilll be only one user
  });
});
