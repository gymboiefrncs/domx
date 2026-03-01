import {
  deleteOldRefreshToken,
  tokenExists,
  fetchUserByEmail,
  fetchUserById,
  fetchUserForSignup,
  createToken,
} from "./auth-model.js";
import type { SignupSchema, LoginSchema } from "./auth-schema.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { UnauthorizedError } from "../../utils/error.js";
import type { RegistrationResult, Tokens, Result } from "../../common/types.js";
import {
  loginFailedEmail,
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "../../utils/sendEmail.js";
import { pool } from "../../config/db.js";
import { generateOTP } from "../../utils/generateOTP.js";
import * as jose from "jose";
import {
  generateTokens,
  refreshTokenExpiry,
} from "../../utils/generateToken.js";
import { handleVerifiedUser } from "./auth-helpers/handleVerifiedUser.js";
import { handleUnverifiedUser } from "./auth-helpers/handleUnverifiedUser.js";
import { handleNewUser } from "./auth-helpers/handleNewUser.js";
import { withTransaction } from "../../config/transaction.js";

// user facing messages.
export const EMAIL_MESSAGE =
  "Verification email sent. Please check your inbox.";
export const COOLDOWN_MESSAGE = "Please wait before requesting another code.";
export const ALREADY_REGISTERED_MESSAGE =
  "If this email is registered, you'll hear from us shortly.";

export const registerUser = async (
  data: SignupSchema,
): Promise<RegistrationResult> => {
  /**
   * Intentionally returns a unified response shape for all cases to prevent user enumeration attacks.
   * Regardless of whether the email is new, unverified, or already verified,
   * the response is with a generic message and status.
   *
   * User needs to prove the ownership first of the email before the user can further finished signing up
   * If concurrent signup requests provide different credentials for the same email,
   * we cannot determine which set is legitimate.
   *
   * By verifying email ownership first, we can ensure that only the user with access to the email can proceed.
   */

  const otpData = generateOTP();

  /**
   * withTransaction owns BEGIN/COMMIT/ROLLBACK entirely.
   * Inside: return to commit, throw to rollback.
   */
  const result = await withTransaction(pool, async (client) => {
    const user = await fetchUserForSignup(data.email, client);

    if (user?.is_verified) {
      return handleVerifiedUser(data.email);
    }

    if (user && !user.is_verified) {
      return await handleUnverifiedUser(user, otpData, client);
    }

    return await handleNewUser(data, otpData, client);
  });

  /**
   * Side effects are deliberately kept OUTSIDE the transaction.
   * Firing emails inside the transaction risks notifying the user
   * before the transaction is committed, which could lead to
   * confusion if ever the transaction rolls back after the email is sent
   */
  if (result.reason === "NEW_USER" || result.reason === "RESENT_OTP") {
    sendVerificationEmail(result.email, otpData.otp).catch((err) => {
      console.error("Failed to send email:", err);
    });
  }

  if (result.reason === "ALREADY_VERIFIED") {
    sendAlreadyRegisteredEmail(result.email).catch((err) => {
      console.error("Failed to email:", err);
    });
  }

  return result;
};

export const loginUser = async (data: LoginSchema): Promise<Tokens> => {
  const user = await fetchUserByEmail(data.email);

  /**
   * Intentionally compare the password BEFORE checking if user exists or is verified.
   * This ensures the response time is constant regardless of whether the email
   * is registered or not, preventing timing attacks that could enumerate emails
   *
   * If user doesn't exist, we compare against a dummy hash to simulate the same workload
   */
  const passwordMatch = await bcrypt.compare(
    data.password,
    user?.password ?? process.env.DUMMY_HASH!,
  );

  if (!user || !user.is_verified || !user.password) {
    throw new UnauthorizedError("Invalid credentials or account not verified");
  }

  if (!passwordMatch) {
    loginFailedEmail(data.email).catch((err) => {
      console.error("Failed to send email:", err);
    });
    throw new UnauthorizedError("Invalid credentials or account not verified");
  }

  const jti = crypto.randomUUID();

  const { accessToken, refreshToken } = await generateTokens(
    user.id,
    user.role,
    jti,
  );

  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await createToken(jti, user.id, hashedToken, refreshTokenExpiry);

  return { accessToken, refreshToken };
};

export const rotateTokens = async (
  oldRefreshToken: string,
): Promise<Tokens> => {
  const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_TOKEN);

  const { payload } = await jose.jwtVerify(oldRefreshToken, refreshSecret);
  const userId = payload.userId as string;

  // check if token exists in DB
  const hasToken = await tokenExists(payload.jti as string);
  if (!hasToken)
    throw new UnauthorizedError("Session expired, please login again");

  // prevent reuse of refresh token
  await deleteOldRefreshToken(payload.jti as string);

  const user = await fetchUserById(userId);
  if (!user) throw new UnauthorizedError("Session expired, please login again");

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

  await createToken(newJti, userId, hashedNewRefreshToken, refreshTokenExpiry);

  return { accessToken, refreshToken };
};

export const logoutUser = async (refreshToken: string): Promise<Result> => {
  const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_TOKEN);

  const { payload } = await jose.jwtVerify(refreshToken, refreshSecret);
  await deleteOldRefreshToken(payload.jti as string);

  return { ok: true, message: "Logged out successfully" };
};
