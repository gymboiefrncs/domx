import { describe, vi, beforeEach, it, expect, afterEach } from "vitest";
import { signupService } from "../../services/auth-service.js";
import { pool, resetDB } from "../../config/db.js";
import { getUserByEmail } from "../../models/auth-model.js";
import {
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "../../utils/sendEmail.js";

vi.mock("../../utils/sendEmail", () => ({
  sendVerificationEmail: vi.fn(),
  sendAlreadyRegisteredEmail: vi.fn(),
}));

describe("Auth integration - Signup", () => {
  beforeEach(async () => {
    await resetDB();
    vi.clearAllMocks();

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should create a new user with correct data", async () => {
    const signupData = {
      email: "sample@gmail.com",
      password: "password123",
      username: "sampleuser",
    };

    const result = await signupService(signupData);
    const user = await getUserByEmail(signupData.email);

    expect(result.ok).toBe(true);
    expect(result.message).toBe(
      "Verification email sent. Please check your email",
    );

    expect(user).toMatchObject({
      email: signupData.email,
      username: signupData.username,
      is_verified: false,
      role: "user",
    });

    expect(user?.password).not.toBe(signupData.password);

    expect(sendVerificationEmail).toHaveBeenCalledWith(
      signupData.email,
      expect.any(String),
    );
    expect(sendAlreadyRegisteredEmail).not.toHaveBeenCalled();
  });

  it("should not create a new user if email is already verified", async () => {
    const signupData = {
      email: "verified@example.com",
      password: "password123",
      username: "verifieduser",
    };

    // pre-insert a verified user
    await pool.query(
      "INSERT INTO users (email, password, username, is_verified) VALUES ($1, $2, $3, $4)",
      [signupData.email, "hashed_pw", signupData.username, true],
    );

    // sign up again with the same email
    const result = await signupService(signupData);

    // should still be only one user
    const rows = await pool.query(
      "SELECT COUNT(*) FROM users WHERE email = $1",
      [signupData.email],
    );

    expect(rows.rows[0].count).toBe("1");

    expect(sendAlreadyRegisteredEmail).toHaveBeenCalledWith(signupData.email);
    expect(sendVerificationEmail).not.toHaveBeenCalled();

    expect(result.ok).toBe(true);
    expect(result.message).toBe(
      "Verification email sent. Please check your email",
    );
  });

  it("should not create a new verification email if less than 2 minutes have passed since last OTP", async () => {
    const signupData = {
      email: "unverified@example.com",
      password: "password123",
      username: "unverifieduser",
    };

    // pre-insert an unverified user
    const result1 = await signupService(signupData);

    const user = await getUserByEmail(signupData.email);

    // sign up again with the same email to trigger OTP rotation
    const result2 = await signupService(signupData);

    // should still be only one otp after signing up again
    const newToken = await pool.query(
      "SELECT COUNT(*) FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    expect(newToken.rows[0].count).toBe("1");

    expect(sendVerificationEmail).toHaveBeenCalledOnce();
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      signupData.email,
      expect.any(String),
    );

    expect(result1.ok).toBe(true);
    expect(result1.message).toBe(
      "Verification email sent. Please check your email",
    );

    expect(result2.ok).toBe(true);
    expect(result2.message).toBe(
      "Verification email just sent. Please wait a moment before requesting again",
    );
  });

  it("should allow OTP rotation if more then 2 minutes have passed since last OTP", async () => {
    const signupData = {
      email: "rotated@example.com",
      password: "password123",
      username: "rotateduser",
    };

    // first signup
    const result1 = await signupService(signupData);

    vi.setSystemTime(new Date(Date.now() + 2 * 60 * 1000 + 5000)); // advance time by 2 minutes and 1 second

    // second signup with same email
    const result2 = await signupService(signupData);

    expect(result1.ok).toBe(true);
    expect(result1.message).toBe(
      "Verification email sent. Please check your email",
    );
    expect(result2.ok).toBe(true);
    expect(result2.message).toBe(
      "Verification email sent. Please check your email",
    );
  });

  it("should only create one verifitcation token if multiple concurrent signups with the same unverified email", async () => {
    const signupData = {
      email: "concurrent@example.com",
      password: "password123",
      username: "concurrentuser",
    };

    await signupService(signupData); // create unverified user

    const user = await getUserByEmail(signupData.email);

    await pool.query(
      `
      UPDATE email_verification
      SET created_at = NOW() - INTERVAL '3 minutes'
      WHERE user_id = $1
      `,
      [user?.id],
    );

    const [result1, result2] = await Promise.all([
      signupService(signupData),
      signupService(signupData),
    ]);

    // verify that only one verification token exists
    const tokenCount = await pool.query(
      "SELECT COUNT(*) FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    const messages = [result1.message, result2.message];
    console.log(messages);
    // we cannot guarantee which request will get the  lock first, so we just check that both possible messages are returned and that only one verification email is sent
    expect(messages).toContain(
      "Verification email sent. Please check your email",
    );
    expect(messages).toContain(
      "Verification email just sent. Please wait a moment before requesting again",
    );

    expect(sendVerificationEmail).toHaveBeenCalledTimes(2);
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      signupData.email,
      expect.any(String),
    );
    expect(tokenCount.rows[0].count).toBe("1");
  });

  it("should handle real unique constraint (23505) during concurrent signup", async () => {
    const signupData = {
      email: "realrace@example.com",
      password: "password123",
      username: "realracer",
    };

    // simulate two concurrent signups with the same email
    const [result1, result2] = await Promise.all([
      signupService(signupData),
      signupService(signupData),
    ]);

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    expect(result1.message).toBe(
      "Verification email sent. Please check your email",
    );
    expect(result2.message).toBe(
      "Verification email sent. Please check your email",
    );

    const users = await pool.query("SELECT * FROM users WHERE email = $1", [
      signupData.email,
    ]);

    // should still be only one user
    expect(users.rows.length).toBe(1);

    // catch block should have triggered for one of the requests due to unique constraint violation
    expect(sendAlreadyRegisteredEmail).toHaveBeenCalledWith(signupData.email);
  });
});
