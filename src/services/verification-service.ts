import { pool } from "../config/db.js";
import {
  createVerificationToken,
  findToken,
  incrementTokenRetries,
  invalidateAllTokensForUser,
  markTokenUsed,
  markUserVerified,
} from "../models/verification-model.js";
import crypto from "crypto";
import {
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "../utils/sendEmail.js";
import { getVerificationStatus } from "../models/auth-model.js";
import { generateOTP } from "../utils/generateOTP.js";
import type { Result } from "../common/types.js";

/**
 * validates a user-provided OTP against the stored hash
 *
 * LOGIC:
 * - enforces single-use policy by marking tokens as used upon successful verification
 * - implements retry limits to prevent brute-force attacks, invalidating tokens after 5 failed attempts
 * - ensures expired tokens cannot be used, providing clear error messages for different failure scenarios
 */
export const verificationService = async ({
  email,
  otp,
}: {
  email: string;
  otp: string;
}): Promise<Result> => {
  // hash the incoming OTP to compare against the stored hash
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // find the user associated with the OTP
    const record = await findToken(email, client);

    // ensure a verification request actually exists
    if (!record) {
      return {
        ok: false,
        reason: "OTP is invalid or expired",
      };
    }

    // verify lifecyle status: used and expired tokens are invalid
    if (record.used_at || record.expires_at < new Date()) {
      return { ok: false, reason: "OTP is invalid or expired" };
    }

    if (record.otp_hash !== hashedOTP) {
      await incrementTokenRetries(record.user_id, record.id, client);
      await client.query("COMMIT");
      return { ok: false, reason: "OTP is invalid or expired" };
    }

    // invalidate all tokens after 5 failed attempts to prevent brute force attacks
    if (record.retries >= 5) {
      await invalidateAllTokensForUser(record.user_id, client);
      await client.query("COMMIT");
      return {
        ok: false,
        reason: "OTP is invalid or expired",
      };
    }

    await markUserVerified(record.user_id, client);
    await markTokenUsed(record.user_id, hashedOTP, client);

    await client.query("COMMIT");
    return { ok: true, message: "Email verified successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// re-issues a verification code for unverified users.
export const resendVerificationService = async (
  email: string,
): Promise<Result> => {
  const verification = await getVerificationStatus(email);

  // if user not found, return generic message to prevent enumarationn attacks
  if (!verification) {
    return {
      ok: true,
      message: "If an account exists, a new code has been sent.",
    };
  }

  // handles already verified users
  if (verification.is_verified) {
    await sendAlreadyRegisteredEmail(email);
    return {
      ok: true,
      message: "If an account exists, a new code has been sent.",
    };
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

    return {
      ok: true,
      message: "If an account exists, a new code has been sent.",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
