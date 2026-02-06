import {
  getUserByEmail,
  getVerificationStatus,
  signupModel,
} from "../models/auth-model.js";
import { createVerificationToken } from "../models/verification-model.js";
import type { SignupSchema } from "../schemas/auth-schema.js";
import bcrypt from "bcrypt";
import { UnauthorizedError } from "../utils/error.js";
import type { User } from "../common/types.js";
import crypto from "crypto";
import {
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "../utils/sendEmail.js";
import { pool } from "../config/db.js";

export const signupService = async (
  data: SignupSchema,
): Promise<{ message: string }> => {
  const verification = await getVerificationStatus(data.email);

  /**
   * if user exists and is verified, send an email notifying them that they are already registered.
   * if user exists but not verified, generae a new OTP, update verification and send a new verification email.
   */
  if (verification) {
    if (verification.is_verified) {
      await sendAlreadyRegisteredEmail(verification.email);
      return { message: "Verification email sent. Please check your email" };
    }

    const otp = crypto.randomBytes(3).toString("hex");
    const token = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await createVerificationToken(verification.id, token, expiresAt, client);

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

  // =================================================================================
  /**
   * if user doesnt exist, create user, generate OTP, save verification and send email
   */
  const { password, ...rest } = data;

  const saltRoundsEnv = process.env.BCRYPT_SALT_ROUNDS;
  const otp = crypto.randomBytes(3).toString("hex");
  const token = crypto.createHash("sha256").update(otp).digest("hex");

  // 2 min from now
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  let saltRounds = 10;
  const MIN_SALT_ROUNDS = 10;
  const MAX_SALT_ROUNDS = 15;
  if (saltRoundsEnv !== undefined) {
    const parsedSaltRounds = Number(saltRoundsEnv);
    if (
      Number.isInteger(parsedSaltRounds) &&
      parsedSaltRounds >= MIN_SALT_ROUNDS &&
      parsedSaltRounds <= MAX_SALT_ROUNDS
    ) {
      saltRounds = parsedSaltRounds;
    }
  }
  const hash = await bcrypt.hash(password, saltRounds);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await signupModel(hash, rest, client);
    await createVerificationToken(result.id, token, expiresAt, client);

    await client.query("COMMIT");

    await sendVerificationEmail(result.email, otp);
  } catch (error) {
    await client.query("ROLLBACK");

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
