import {
  deleteOldRefreshToken,
  fetchTokenByJti,
  fetchUserByEmail,
  fetchUserById,
  fetchUserForSignup,
  createToken,
} from "./auth-model.js";
import type { SignupSchema } from "./auth-schema.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { UnauthorizedError } from "../../utils/error.js";
import type {
  RegistrationResult,
  Role,
  Tokens,
  User,
} from "../../common/types.js";
import {
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
import type { Result } from "../../common/types.js";
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
   * Sending an email can be slow; doing it inside the transaction
   * would keep locks and a DB connection open unnecessarily.
   */
  if (result.reason === "NEW_USER" || result.reason === "RESENT_OTP") {
    sendVerificationEmail(result.email, otpData.otp).catch((err) => {
      console.error("Failed to send email:", err);
    });
  }

  if (result.reason === "ALREADY_VERIFIED") {
    sendAlreadyRegisteredEmail(data.email).catch((err) => {
      console.error("Failed to email:", err);
    });
  }

  return result;
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

  if (!user || !user.is_verified || !user.password) {
    throw new UnauthorizedError("Invalid credentials or account not verified");
  }

  if (!passwordMatch) {
    sendAlreadyRegisteredEmail(data.email).catch((err) => {
      console.error("Failed to send already registered email:", err);
    });
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
  const storedRefreshToken = await fetchTokenByJti(payload.jti as string);
  if (!storedRefreshToken)
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
