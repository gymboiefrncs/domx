import {
  deleteOldRefreshToken,
  getTokenByJTI,
  getUserByEmail,
  getUserById,
  getVerificationStatus,
  signupModel,
  insertToken,
  getLatestOTP,
} from "../models/auth-model.js";
import {
  createVerificationToken,
  invalidateAllTokensForUser,
} from "../models/verification-model.js";
import type { SignupSchema } from "../schemas/auth-schema.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { UnauthorizedError } from "../utils/error.js";
import type { Role, Tokens, User } from "../common/types.js";
import {
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "../utils/sendEmail.js";
import { pool } from "../config/db.js";
import { generateOTP } from "../utils/generateOTP.js";
import * as jose from "jose";
import { generateTokens } from "./generateToken.js";
import type { Result } from "../common/types.js";

/**
 * Handles user registration logic with locking.
 *
 * Workflow:
 * 1. Transaction Start: Locks user record (if exists) via FOR UPDATE.
 * 2. If Verified: Rollback and notify user they already have an account.
 * 3. If Unverified: Invalidate old tokens, rotate to a new OTP, and Commit.
 * 4. If New User: Hash password, create record, and Commit.
 */
export const signupService = async (
  data: SignupSchema,
): Promise<{ ok: true; message: string }> => {
  const { password, ...rest } = data;
  const { otp, hashedOTP, expiresAt } = generateOTP();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const verification = await getVerificationStatus(data.email, client);

    if (verification) {
      if (verification.is_verified) {
        await client.query("ROLLBACK");
        await sendAlreadyRegisteredEmail(verification.email);
        return {
          ok: true,
          message: "Verification email sent. Please check your email",
        };
      }

      /**
       * if user exist but not yet verified
       *  - if last OTP sent more than 2 minutes ago, rotate OTP and invalidate old tokens
       *  - else, prevent OTP rotation and ask user to wait
       */
      const latestToken = await getLatestOTP(verification.id, client);
      if (
        !latestToken ||
        Date.now() - latestToken.created_at.getTime() > 2 * 60 * 1000
      ) {
        await invalidateAllTokensForUser(verification.id, client);
        await createVerificationToken(
          verification.id,
          hashedOTP,
          expiresAt,
          client,
        );

        await client.query("COMMIT");

        await sendVerificationEmail(verification.email, otp);

        return {
          ok: true,
          message: "Verification email sent. Please check your email",
        };
      } else {
        await client.query("ROLLBACK");
        return {
          ok: true,
          message:
            "Verification email just sent. Please wait a moment before requesting again",
        };
      }
    }

    // if new user, create account and send verification email
    const saltRoundsEnv = Number(process.env.BCRYPT_SALT_ROUNDS);
    const saltRounds =
      saltRoundsEnv >= 10 && saltRoundsEnv <= 15 ? saltRoundsEnv : 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const result = await signupModel(hash, rest, client);
    await createVerificationToken(result.id, hashedOTP, expiresAt, client);

    await client.query("COMMIT");

    await sendVerificationEmail(result.email, otp);
    return {
      ok: true,
      message: "Verification email sent. Please check your email",
    };
  } catch (error) {
    await client.query("ROLLBACK");

    /**
     * Catch unique constraint violation
     */
    if ((error as any).code === "23505") {
      await sendAlreadyRegisteredEmail(data.email);
      return {
        ok: true,
        message: "Verification email sent. Please check your email",
      };
    }
    throw error;
  } finally {
    client.release();
  }
};

export const loginService = async (
  data: Pick<User, "email" | "password">,
): Promise<Tokens> => {
  const user = await getUserByEmail(data.email);

  // to prevent timing attacks
  const passwordMatch = await bcrypt.compare(
    data.password,
    user?.password ?? process.env.DUMMY_HASH!,
  );

  if (!user || !passwordMatch || !user.is_verified) {
    throw new UnauthorizedError("Invalid credentials or account not verified");
  }

  const jti = crypto.randomUUID();

  const { accessToken, refreshToken } = await generateTokens(
    user.id,
    user.role as Role,
    jti,
  );

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await insertToken(
    jti,
    user.id,
    tokenHash,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );

  return { accessToken, refreshToken };
};

export const refreshService = async (
  oldRefreshToken: string,
): Promise<Tokens> => {
  const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_TOKEN);

  const { payload } = await jose.jwtVerify(oldRefreshToken, refreshSecret);
  const userId = payload.userId as string;

  const storedToken = await getTokenByJTI(payload.jti as string);
  if (!storedToken)
    throw new UnauthorizedError("Session expired, please login again");

  const incomingHash = crypto
    .createHash("sha256")
    .update(oldRefreshToken)
    .digest("hex");

  if (storedToken.token_hash !== incomingHash)
    throw new UnauthorizedError("Session expired, please login again");

  const user = await getUserById(userId);
  if (!user) throw new UnauthorizedError("Session expired, please login again");

  await deleteOldRefreshToken(payload.jti as string);

  const newJti = crypto.randomUUID();

  const { accessToken, refreshToken } = await generateTokens(
    userId,
    user.role,
    newJti,
  );

  const newTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await insertToken(
    newJti,
    userId,
    newTokenHash,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );

  return { accessToken, refreshToken };
};

export const logoutService = async (refreshToken: string): Promise<Result> => {
  const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_TOKEN);

  const { payload } = await jose.jwtVerify(refreshToken, refreshSecret);
  await deleteOldRefreshToken(payload.jti as string);

  return { ok: true, message: "Logged out successfully" };
};
