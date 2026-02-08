import {
  getUserByEmail,
  getVerificationStatus,
  signupModel,
} from "../models/auth-model.js";
import {
  createVerificationToken,
  invalidateAllTokensForUser,
} from "../models/verification-model.js";
import type { SignupSchema } from "../schemas/auth-schema.js";
import bcrypt from "bcrypt";
import { UnauthorizedError } from "../utils/error.js";
import type { User } from "../common/types.js";
import {
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "../utils/sendEmail.js";
import { pool } from "../config/db.js";
import { generateOTP } from "../utils/generateOTP.js";

/**
 * Handles user registration logic.
 * Workflow:
 * 1. If verified: notify user they already have an account.
 * 2. If unverified: rotate OTP tokens and resend email.
 * 3. If new: hash password, create user, and send initial OTP.
 */
export const signupService = async (
  data: SignupSchema,
): Promise<{ message: string }> => {
  const verification = await getVerificationStatus(data.email);

  if (verification) {
    if (verification.is_verified) {
      await sendAlreadyRegisteredEmail(verification.email);
      return { message: "Verification email sent. Please check your email" };
    }

    const { otp, hashedOTP, expiresAt } = generateOTP();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // invalidate all previous tokens for the user before creating a new one
      await invalidateAllTokensForUser(verification.id, client);
      await createVerificationToken(
        verification.id,
        hashedOTP,
        expiresAt,
        client,
      );

      await client.query("COMMIT");

      await sendVerificationEmail(verification.email, otp);
      return { message: "Verification email sent. Please check your email" };
    } catch (error) {
      await client.query("ROLLBACK");

      // unique constraint violation
      if ((error as any).code === "23505") {
        await sendAlreadyRegisteredEmail(data.email);
        return { message: "Verification email sent. Please check your email" };
      }
      throw error;
    } finally {
      client.release();
    }
  }

  // new User Registration Path
  const { password, ...rest } = data;
  const { otp, hashedOTP, expiresAt } = generateOTP();

  const saltRoundsEnv = Number(process.env.BCRYPT_SALT_ROUNDS);
  const saltRounds =
    saltRoundsEnv >= 10 && saltRoundsEnv <= 15 ? saltRoundsEnv : 10;

  const hash = await bcrypt.hash(password, saltRounds);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await signupModel(hash, rest, client);
    await createVerificationToken(result.id, hashedOTP, expiresAt, client);

    await client.query("COMMIT");

    await sendVerificationEmail(result.email, otp);
  } catch (error) {
    await client.query("ROLLBACK");

    // unique constraint violation. prevents leaking user existence
    if ((error as any).code === "23505") {
      return { message: "Verification email sent. Please check your email" };
    }

    throw error;
  } finally {
    client.release();
  }

  return { message: "Verification email sent. Please check your email" };
};

export const loginService = async (
  data: Pick<User, "email" | "password">,
): Promise<Pick<User, "username" | "email">> => {
  const user = await getUserByEmail(data.email);

  if (!user) throw new UnauthorizedError("Invalid credentials");

  const passwordMatch = await bcrypt.compare(data.password, user.password);

  if (!passwordMatch) throw new UnauthorizedError("Invalid credentials");

  return { username: user.username, email: user.email };
};
