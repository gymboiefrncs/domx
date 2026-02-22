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
import type { Role, Tokens, User } from "../../common/types.js";
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

export const EMAIL_MESSAGE = "Verification email sent. Please check your email";
export const COOLDOWN_MESSAGE =
  "Verification email just sent. Please wait a moment before requesting again";

export const registerUser = async (
  data: SignupSchema,
): Promise<{ ok: true; message: string }> => {
  const { ...rest } = data;
  const otpData = generateOTP();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const user = await fetchUserForSignup(data.email, client);

    if (user?.is_verified) {
      await client.query("ROLLBACK");
      return handleVerifiedUser(user.email);
    }

    if (user) {
      const result = await handleUnverifiedUser(user, otpData, client);
      if (result.message === COOLDOWN_MESSAGE) {
        await client.query("ROLLBACK");
      } else {
        await client.query("COMMIT");

        sendVerificationEmail(user.email, otpData.otp).catch((error) => {
          console.error("Failed to email:", error);
        });
        return { ok: true, message: EMAIL_MESSAGE };
      }

      return result;
    }

    // New user
    await handleNewUser(rest, otpData, client);
    await client.query("COMMIT");
    sendVerificationEmail(data.email, otpData.otp).catch((error) => {
      console.error("Failed to email:", error);
    });

    return { ok: true, message: EMAIL_MESSAGE };
  } catch (error) {
    await client.query("ROLLBACK");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === "23505") {
      sendAlreadyRegisteredEmail(data.email).catch((error) => {
        console.error("failed to send email:", error);
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

  if (!user || !passwordMatch || !user.is_verified || !user.password) {
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
