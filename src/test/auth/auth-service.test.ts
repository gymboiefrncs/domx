import { describe, vi, it, expect, beforeEach, afterEach } from "vitest";
import { registerUser } from "../../features/auth/auth-service.js";
import { pool } from "../../config/db.js";
import { fetchUserByEmail } from "../../features/auth/auth-model.js";
import {
  EMAIL_MESSAGE,
  COOLDOWN_MESSAGE,
} from "../../features/auth/auth-service.js";
import { OTP_COOLDOWN_MS } from "../../features/auth/auth-helpers/handleUnverifiedUser.js";

vi.mock("../../utils/sendEmail", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendAlreadyRegisteredEmail: vi.fn().mockResolvedValue(undefined),
}));

// INTEGRATION TESTS — registerUser
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
    const signupData = { email: "sample@gmail.com" };

    const result = await registerUser(signupData);
    const user = await fetchUserByEmail(signupData.email);
    const otp = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    expect(result).toEqual({
      ok: true,
      reason: "NEW_USER",
      email: signupData.email,
      message: EMAIL_MESSAGE,
    });
    expect(otp.rows).toHaveLength(1);
    expect(user).toMatchObject({
      email: signupData.email,
      is_verified: false,
      role: "user",
    });
  });

  // =========================== VERIFIED USER ============================
  it("should not create a new user if email is already verified", async () => {
    const signupData = { email: "verified@example.com" };

    await pool.query(
      "INSERT INTO users (email, password, is_verified) VALUES ($1, $2, $3)",
      [signupData.email, "hashed_pw", true],
    );

    const result = await registerUser(signupData);
    const user = await fetchUserByEmail(signupData.email);

    expect(user).toBeDefined();
    expect(user?.email).toBe(signupData.email);
    expect(result).toEqual({
      ok: true,
      reason: "ALREADY_VERIFIED",
      email: signupData.email,
      message: EMAIL_MESSAGE,
    });
  });

  // =========================== UNVERIFIED USER & OTP ROTATION ============================
  it("should not rotate OTP if cooldown is active", async () => {
    const signupData = { email: "unverified@example.com" };

    await registerUser(signupData);
    const user = await fetchUserByEmail(signupData.email);
    const firstOtp = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    const result = await registerUser(signupData);
    const currentOtp = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    expect(result).toEqual({
      ok: true,
      reason: "COOLDOWN",
      message: COOLDOWN_MESSAGE,
    });
    expect(currentOtp.rows[0].id).toBe(firstOtp.rows[0].id);
    expect(currentOtp.rows[0].created_at).toEqual(firstOtp.rows[0].created_at);
  });

  it("should rotate OTP after the cooldown expires", async () => {
    const signupData = { email: "rotated@example.com" };

    await registerUser(signupData);
    const user = await fetchUserByEmail(signupData.email);
    const firstOtp = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    // Advance past the OTP_COOLDOWN_MS (2 minutes) with a buffer
    vi.setSystemTime(new Date(Date.now() + OTP_COOLDOWN_MS + 5000));

    const result = await registerUser(signupData);
    const secondOtp = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    expect(result).toEqual({
      ok: true,
      reason: "RESENT_OTP",
      email: signupData.email,
      message: EMAIL_MESSAGE,
    });
    expect(secondOtp.rows[0].id).not.toBe(firstOtp.rows[0].id);
    expect(secondOtp.rows[0].created_at).not.toEqual(
      firstOtp.rows[0].created_at,
    );
  });

  it("should only create one verification token for concurrent signups with the same unverified email", async () => {
    const signupData = { email: "concurrent@example.com" };

    await registerUser(signupData);
    const user = await fetchUserByEmail(signupData.email);

    // Push the existing OTP's created_at into the past to allow rotation
    await pool.query(
      `UPDATE email_verification
       SET created_at = NOW() - INTERVAL '3 minutes'
       WHERE user_id = $1`,
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

    // The FOR UPDATE lock in fetchUserForSignup serializes these requests.
    // One will rotate the OTP, the other will hit the cooldown guard.
    expect(messages).toContain(EMAIL_MESSAGE);
    expect(messages).toContain(COOLDOWN_MESSAGE);
    expect(rows).toHaveLength(1);
  });

  it("should handle a real unique constraint race (23505) during concurrent signup of a brand-new email", async () => {
    const signupData = { email: "realrace@example.com" };

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

    // With ON CONFLICT DO NOTHING, the race loser in handleNewUser now also
    // returns NEW_USER and steps aside, so both responses are identical.
    expect(result1).toEqual({
      ok: true,
      reason: "NEW_USER",
      email: signupData.email,
      message: EMAIL_MESSAGE,
    });
    expect(result2).toEqual({
      ok: true,
      reason: "NEW_USER",
      email: signupData.email,
      message: EMAIL_MESSAGE,
    });
    expect(users.rows).toHaveLength(1);
    expect(otp.rows).toHaveLength(1);
  });
});
