import { describe, vi, it, expect, beforeEach } from "vitest";
import { registerUser } from "@api/features/auth/auth.services.js";
import { pool } from "@api/shared/db/db.js";
import { fetchUserByEmail } from "@api/features/auth/auth.repositories.js";
import { VERIFICATION_SUCCESS } from "@api/features/verification/verification.constants.js";
import { setInfo } from "@api/features/auth/auth.setInfo.js";
import bcrypt from "bcrypt";

const INFO_SET_FAILED_MESSAGE = "Failed to set information";
const EMAIL_MESSAGE = VERIFICATION_SUCCESS.EMAIL_SENT;

vi.mock("@api/shared/mailer/sendEmail.js", () => ({
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
      reason: "NEW_USER",
      email: signupData.email,
      message: EMAIL_MESSAGE,
    });
    expect(otp.rows).toHaveLength(1);
    expect(user).toMatchObject({
      email: signupData.email,
      is_verified: false,
    });
  });

  // =========================== VERIFIED USER ============================
  it("should not create a new user if email is already verified", async () => {
    const signupData = { email: "verified@example.com" };

    await pool.query("INSERT INTO users (email, is_verified) VALUES ($1, $2)", [
      signupData.email,
      true,
    ]);

    const result = await registerUser(signupData);
    const user = await fetchUserByEmail(signupData.email);

    expect(user).toBeDefined();
    expect(user?.email).toBe(signupData.email);
    expect(result).toEqual({
      reason: "INCOMPLETE_SIGNUP",
      message:
        "Incomplete signup. Please set your username and password to complete the registration.",
      data: {
        setInfoToken: expect.any(String),
      },
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
      message: EMAIL_MESSAGE,
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

    const reasons = [result1, result2].flatMap((result) =>
      "reason" in result ? [result.reason] : [],
    );
    const { rows } = await pool.query(
      "SELECT * FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    // The FOR UPDATE lock in fetchUserForSignup serializes these requests.
    // One will rotate the OTP, the other will hit the cooldown guard.
    expect(reasons).toContain("RESENT_OTP");
    expect(reasons).toHaveLength(1);
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

    expect(users.rows).toHaveLength(1);
    expect(otp.rows).toHaveLength(1);

    const reasons = [result1, result2].flatMap((result) =>
      "reason" in result ? [result.reason] : [],
    );
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

    await setInfo({
      userId,
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
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

    await expect(
      setInfo({
        userId,
        username: "anotheruser",
        password: "AnotherPass456_",
      }),
    ).rejects.toThrow(INFO_SET_FAILED_MESSAGE);

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

    await expect(
      setInfo({
        userId,
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
      }),
    ).rejects.toThrow(INFO_SET_FAILED_MESSAGE);

    const user = await pool.query("SELECT password FROM users WHERE id = $1", [
      userId,
    ]);
    expect(user.rows[0].password).toBeNull();
  });
});
