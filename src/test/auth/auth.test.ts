import { describe, vi, beforeEach, it, expect } from "vitest";
import { signupService } from "../../services/auth-service.js";
import { pool, resetDB } from "../../config/db.js";
import { getUserByEmail } from "../../models/auth-model.js";
import {
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "../../utils/sendEmail.js";
import * as authModel from "../../models/auth-model.js";
import * as tokenModel from "../../models/verification-model.js";

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
  });

  it("should not create a new user if email is already verified", async () => {
    const signupData = {
      email: "verified@example.com",
      password: "password123",
      username: "verifieduser",
    };

    await pool.query(
      "INSERT INTO users (email, password, username, is_verified) VALUES ($1, $2, $3, $4)",
      [signupData.email, "hashed_pw", signupData.username, true],
    );

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

    await signupService(signupData);

    // should still be only one token after signing up again
    const newToken = await pool.query(
      "SELECT COUNT(*) FROM email_verification WHERE user_id = $1 AND used_at IS NULL",
      [user?.id],
    );
    expect(newToken.rows[0].count).toBe("1");
  });

  it("should call sendAlreadyRegisteredEmail if email is already verified", async () => {
    const signupData = {
      email: "alreadyRegistered@example.com",
      password: "password123",
      username: "alreadyRegisteredUser",
    };

    await pool.query(
      "INSERT INTO users (email, password, username, is_verified) VALUES ($1, $2, $3, $4)",
      [signupData.email, "hashed_pw", signupData.username, true],
    );

    const result = await signupService(signupData);
    expect(result.ok).toBe(true);

    expect(sendAlreadyRegisteredEmail).toHaveBeenCalledWith(signupData.email);
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("should handle race conditions via the 23505 error catch", async () => {
    const signupData = {
      email: "race@condition.com",
      password: "password123",
      username: "racer",
    };

    const dbError = Object.assign(new Error("Unique violation"), {
      code: "23505",
    });

    const signupSpy = vi
      .spyOn(authModel, "signupModel")
      .mockRejectedValueOnce(dbError);

    const result = await signupService(signupData);

    expect(result.ok).toBe(true);

    expect(sendAlreadyRegisteredEmail).toHaveBeenCalledWith(signupData.email);
    expect(authModel.signupModel).toHaveBeenCalled();
    signupSpy.mockRestore();
  });

  it("should rollback user creation if the verification token fails to generate", async () => {
    const signupData = {
      email: "ghost@gmail.com",
      password: "password123",
      username: "ghostuser",
    };

    vi.spyOn(tokenModel, "createVerificationToken").mockRejectedValueOnce(
      new Error("Token generation failed"),
    );

    await expect(signupService(signupData)).rejects.toThrow(
      "Token generation failed",
    );

    const user = await getUserByEmail(signupData.email);
    expect(user).toBeUndefined();
  });
});
