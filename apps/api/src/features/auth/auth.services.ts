import {
  deleteOldRefreshToken,
  tokenExists,
  fetchUserByEmail,
  fetchUserById,
  createToken,
  fetchUserForSignup,
} from "./auth.repositories.js";
import type { SignupSchema, LoginSchema } from "./auth.schemas.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { UnauthorizedError } from "@api/utils/error.js";
import type { RegistrationResult, Tokens } from "./auth.types.js";
import type { Result } from "@api/common/types.js";
import {
  loginFailedEmail,
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "@api/utils/sendEmail.js";
import { pool } from "@api/config/db.js";
import { generateOTP } from "@api/features/auth/auth-helpers/generateOTP.js";
import * as jose from "jose";
import {
  generateTokens,
  getRefreshTokenExpiry,
} from "./auth-helpers/generateToken.js";
import { handleVerifiedUser } from "./auth-helpers/handleVerifiedUser.js";
import { handleUnverifiedUser } from "./auth-helpers/handleUnverifiedUser.js";
import { handleNewUser } from "./auth-helpers/handleNewUser.js";
import { withTransaction } from "@api/config/transaction.js";
import { LOGOUT_MESSAGE } from "./auth.constants.js";
import { handleIncompleteSignup } from "./auth-helpers/handleIncompleteSignup.js";
import { generateSession } from "./auth-helpers/generateSession.js";

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

    if (user?.is_verified && user?.password && user?.username) {
      return handleVerifiedUser(data.email);
    }

    if (user?.is_verified && (!user.password || !user.username)) {
      /**
       * This case is hit when a user completes email verification but
       * fails to complete the rest of the signup flow (e.g. due to network issues or closing the tab).
       *
       * We treat this as an incomplete signup and allow them to restart the signup flow by generating a new set info token.
       */
      return await handleIncompleteSignup(user.id);
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
    if (process.env.NODE_ENV === "development") {
      console.log(`Verification OTP for ${result.email}: ${otpData.otp})`);
    } else {
      sendVerificationEmail(result.email, otpData.otp).catch((err) => {
        console.error("Failed to email:", err);
      });
    }
  }

  if (result.reason === "ALREADY_VERIFIED") {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `Attempt to register already verified email ${result.email}. Sent "already registered" email.`,
      );
    } else {
      sendAlreadyRegisteredEmail(result.email).catch((err) => {
        console.error("Failed to email:", err);
      });
    }
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
    throw new UnauthorizedError("Invalid credentials");
  }

  if (!passwordMatch) {
    loginFailedEmail(data.email).catch((err) => {
      console.error("Failed to send email:", err);
    });
    throw new UnauthorizedError("Invalid credentials");
  }

  return generateSession(user.id, user.role);
};

export const rotateTokens = async (
  oldRefreshToken: string,
): Promise<Tokens> => {
  const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_TOKEN);

  const { payload } = await jose.jwtVerify(oldRefreshToken, refreshSecret);

  const userId = payload.userId;
  const jti = payload.jti;
  if (typeof userId !== "string" || typeof jti !== "string") {
    throw new UnauthorizedError("Invalid token payload");
  }

  // check if token exists in DB
  const hasToken = await tokenExists(jti);
  if (!hasToken)
    throw new UnauthorizedError("Session expired, please login again");

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

  /**
   * withTransaction owns BEGIN/COMMIT/ROLLBACK entirely.
   * Inside: return to commit, throw to rollback.
   */
  await withTransaction(pool, async (client) => {
    // prevent reuse of refresh token
    await deleteOldRefreshToken(jti, client);
    await createToken(
      newJti,
      userId,
      hashedNewRefreshToken,
      getRefreshTokenExpiry(),
      client,
    );
  });

  return { accessToken, refreshToken };
};

export const logoutUser = async (refreshToken: string): Promise<Result> => {
  try {
    const refreshSecret = new TextEncoder().encode(
      process.env.JWT_REFRESH_TOKEN,
    );

    const { payload } = await jose.jwtVerify(refreshToken, refreshSecret);

    const jti = payload.jti;
    if (typeof jti === "string") {
      await deleteOldRefreshToken(jti);
    }
  } catch (_error) {
    // Ignore errors and allow logout to succeed
  }
  return { ok: true, message: LOGOUT_MESSAGE };
};
