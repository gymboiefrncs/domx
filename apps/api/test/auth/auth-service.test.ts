import { describe, vi, it, expect, beforeEach } from "vitest";
import { registerUser } from "@api/features/auth/auth-service.js";
import { pool } from "@api/config/db.js";
import { fetchUserByEmail } from "../../src/features/auth/auth-model.js";
import {
  EMAIL_MESSAGE,
  COOLDOWN_MESSAGE,
  INFO_SET_SUCCESS_MESSAGE,
  INFO_SET_FAILED_MESSAGE,
} from "@api/common/constants.js";
import { setInfo } from "../../src/features/auth/set-info.js";
import bcrypt from "bcrypt";

vi.mock("@api/src/utils/sendEmail.ts", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendAlreadyRegisteredEmail: vi.fn().mockResolvedValue(undefined),
}));

// INTEGRATION TESTS — registerUser
describe("Auth integration - Signup", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
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

    // Move the OTP's created_at into the past to simulate cooldown expiry
    await pool.query(
      `UPDATE email_verification
       SET created_at = NOW() - INTERVAL '3 minutes'
       WHERE user_id = $1`,
      [user?.id],
    );

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

    const reasons = [result1.reason, result2.reason];
    const { rows } = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    // The FOR UPDATE lock in fetchUserForSignup serializes these requests.
    // One will rotate the OTP, the other will hit the cooldown guard.
    expect(reasons).toContain("RESENT_OTP");
    expect(reasons).toContain("COOLDOWN");
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

    // System invariants: exactly one user, exactly one OTP, no errors.
    // The exact reason per call depends on scheduling:
    //   - If both fetch null → both take handleNewUser → both return NEW_USER
    //   - If Request A commits before Request B fetches → Request B sees the user → COOLDOWN
    expect(users.rows).toHaveLength(1);
    expect(otp.rows).toHaveLength(1);
    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);

    const reasons = [result1.reason, result2.reason];
    expect(reasons).toContain("NEW_USER");
    expect(reasons).toContain("UNIQUE_EMAIL_VIOLATION");
  });
});

describe("Auth integration - Set Info", () => {
  const TEST_EMAIL = "setinfo@example.com";
  const TEST_USERNAME = "testuser";
  const TEST_PASSWORD = "SecurePass123_";

  const createVerifiedUser = async (): Promise<string> => {
    const result = await pool.query<{ id: string }>(
      "INSERT INTO users (email, is_verified) VALUES ($1, true) RETURNING id",
      [TEST_EMAIL],
    );
    return result.rows[0]!.id;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should update password, username, and create display_id for a verified user", async () => {
    const userId = await createVerifiedUser();

    const result = await setInfo({
      userId,
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    });

    expect(result).toEqual({
      ok: true,
      message: INFO_SET_SUCCESS_MESSAGE,
    });

    const user = await pool.query(
      "SELECT password, username, display_id FROM users WHERE id = $1",
      [userId],
    );

    const row = user.rows[0];
    expect(row.username).toBe(TEST_USERNAME);
    expect(row.display_id).toBeDefined();
    expect(row.display_id).toBeDefined();
    expect(row.password).toBeDefined();

    const passwordMatch = await bcrypt.compare(TEST_PASSWORD, row.password);
    expect(passwordMatch).toBe(true);
  });

  it("should fail if the user already has a password set", async () => {
    const userId = await createVerifiedUser();

    await setInfo({
      userId,
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    });

    const result = await setInfo({
      userId,
      username: "anotheruser",
      password: "AnotherPass456_",
    });

    expect(result).toEqual({
      ok: false,
      message: INFO_SET_FAILED_MESSAGE,
    });

    const user = await pool.query(
      "SELECT password, username FROM users WHERE id = $1",
      [userId],
    );
    const passwordStillOriginal = await bcrypt.compare(
      TEST_PASSWORD,
      user.rows[0].password,
    );
    expect(passwordStillOriginal).toBe(true);
  });

  it("should fail for a non-verified user", async () => {
    const unverified = await pool.query<{ id: string }>(
      "INSERT INTO users (email, is_verified) VALUES ($1, false) RETURNING id",
      ["unverified-setinfo@example.com"],
    );
    const userId = unverified.rows[0]!.id;

    const result = await setInfo({
      userId,
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    });

    expect(result).toEqual({
      ok: false,
      message: INFO_SET_FAILED_MESSAGE,
    });

    const user = await pool.query("SELECT password FROM users WHERE id = $1", [
      userId,
    ]);
    expect(user.rows[0].password).toBeNull();
  });
});
