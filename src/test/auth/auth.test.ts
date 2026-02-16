import { describe, vi, beforeEach, it, expect } from "vitest";
import { signupService } from "../../services/auth-service.js";
import { pool, resetDB } from "../../config/db.js";
import { getUserByEmail } from "../../models/auth-model.js";

vi.mock("../../utils/sendEmail.js", () => ({
  sendVerificationEmail: vi.fn(),
  sendAlreadyRegisteredEmail: vi.fn(),
}));

describe("Auth integration - Signup", () => {
  beforeEach(async () => {
    await resetDB();
    vi.clearAllMocks();
  });

  it("should create a new user with correct data", async () => {
    const signupData = {
      email: "sample@gmail.com",
      password: "password123",
      username: "sampleuser",
    };

    const result = await signupService(signupData);

    expect(result.ok).toBe(true);
    expect(result.message).toBe(
      "Verification email sent. Please check your email",
    );

    const user = await getUserByEmail(signupData.email);
    expect(user).toBeDefined();
    expect(user?.email).toBe(signupData.email);
    expect(user?.is_verified).toBe(false);
    expect(user?.username).toBe(signupData.username);
    expect(user?.role).toBe("user");
  });

  it("should not create a new user if email is already verified", async () => {
    const signupData = {
      email: "verified@example.com",
      password: "password123",
      username: "verifieduser",
    };

    await signupService(signupData);

    await pool.query("UPDATE users SET is_verified = true WHERE email = $1", [
      signupData.email,
    ]);

    const result = await signupService(signupData);
    expect(result.ok).toBe(true);

    const rows = await pool.query(
      "SELECT COUNT(*) FROM users WHERE email = $1",
      [signupData.email],
    );
    expect(rows.rows[0].count).toBe("1");
  });

  it("should create a new verification token if email is unverified", async () => {
    const signupData = {
      email: "unverified@example.com",
      password: "password123",
      username: "unverifieduser",
    };
    await signupService(signupData);

    const user = await getUserByEmail(signupData.email);

    const oldToken = await pool.query(
      "SELECT COUNT(*) FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );

    expect(oldToken.rows[0].count).toBe("1");

    await signupService(signupData);

    const newToken = await pool.query(
      "SELECT COUNT(*) FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );
    expect(newToken.rows[0].count).toBe("1");
  });
});
