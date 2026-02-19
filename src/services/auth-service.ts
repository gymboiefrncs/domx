import {
  deleteOldRefreshToken,
  fetchTokenByJti,
  fetchUserByEmail,
  fetchUserById,
  fetchUserForSignup,
  createToken,
} from "../models/auth-model.js";
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
import { generateTokens } from "../utils/generateToken.js";
import type { Result } from "../common/types.js";
import { handleVerifiedUser } from "../utils/auth-helpers/handleVerifiedUser.js";
import { handleUnverifiedUser } from "../utils/auth-helpers/handleUnverifiedUser.js";
import { handleNewUser } from "../utils/auth-helpers/handleNewUser.js";

export const EMAIL_MESSAGE = "Verification email sent. Please check your email";
export const COOLDOWN_MESSAGE =
  "Verification email just sent. Please wait a moment before requesting again";

export const registerUser = async (
  data: SignupSchema,
): Promise<{ ok: true; message: string }> => {
  const { password, ...rest } = data;
  const otpData = generateOTP();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const user = await fetchUserForSignup(data.email, client);

    // user exist but verified, prevent registration and send email about existing account
    if (user?.is_verified) {
      await client.query("ROLLBACK");
      return handleVerifiedUser(user.email);
    }

    /**
     * if user exist but not yet verified
     *  - if last OTP sent more than 2 minutes ago, rotate OTP and invalidate old otps
     *  - else, prevent OTP rotation and ask user to wait
     */
    if (user) {
      const result = await handleUnverifiedUser(user, otpData, client);
      if (result.message === COOLDOWN_MESSAGE) {
        await client.query("ROLLBACK");
      } else {
        await client.query("COMMIT");
        sendVerificationEmail(user.email, otpData.otp).catch((error) => {
          console.error("Failed to send verification email:", error);
        });
        return { ok: true, message: EMAIL_MESSAGE };
      }

      return result;
    }

    // if new user, create account and send verification email
    await handleNewUser(rest, password, otpData, client);
    await client.query("COMMIT");
    sendVerificationEmail(data.email, otpData.otp).catch((error) => {
      console.error("Failed to send verification email:", error);
    });

    return { ok: true, message: EMAIL_MESSAGE };
  } catch (error) {
    await client.query("ROLLBACK");

    // Catch unique constraint violation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === "23505") {
      sendAlreadyRegisteredEmail(data.email).catch((error) => {
        console.error("Failed to send already registered email:", error);
      });
      return { ok: true, message: EMAIL_MESSAGE };
    }
    throw error;
  } finally {
    client.release();
  }
};

export const loginUser = async (
  data: Pick<User, "email" | "password">,
): Promise<Tokens> => {
  const user = await fetchUserByEmail(data.email);

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

  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await createToken(
    jti,
    user.id,
    hashedToken,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );

  return { accessToken, refreshToken };
};

export const rotateTokens = async (
  oldRefreshToken: string,
): Promise<Tokens> => {
  const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_TOKEN);

  const { payload } = await jose.jwtVerify(oldRefreshToken, refreshSecret);
  const userId = payload.userId as string;

  const storedRefreshToken = await fetchTokenByJti(payload.jti as string);
  if (!storedRefreshToken)
    throw new UnauthorizedError("Session expired, please login again");

  const hashedOldRefreshToken = crypto
    .createHash("sha256")
    .update(oldRefreshToken)
    .digest("hex");

  if (storedRefreshToken.token_hash !== hashedOldRefreshToken)
    throw new UnauthorizedError("Session expired, please login again");

  const user = await fetchUserById(userId);
  if (!user) throw new UnauthorizedError("Session expired, please login again");

  await deleteOldRefreshToken(payload.jti as string);

  const newJti = crypto.randomUUID();

  const { accessToken, refreshToken } = await generateTokens(
    userId,
    user.role,
    newJti,
  );

  const hashedNewRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await createToken(
    newJti,
    userId,
    hashedNewRefreshToken,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );

  return { accessToken, refreshToken };
};

export const logoutUser = async (refreshToken: string): Promise<Result> => {
  const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_TOKEN);

  const { payload } = await jose.jwtVerify(refreshToken, refreshSecret);
  await deleteOldRefreshToken(payload.jti as string);

  return { ok: true, message: "Logged out successfully" };
};
