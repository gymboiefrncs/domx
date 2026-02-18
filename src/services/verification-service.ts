import { pool } from "../config/db.js";
import {
  createSignupOtp,
  fetchOtp,
  incrementRetries,
  invalidateOldOtps,
  markTokenAsUsed,
  markUserAsVerified,
} from "../models/verification-model.js";
import crypto from "crypto";
import {
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "../utils/sendEmail.js";
import { fetchUserForSignup } from "../models/auth-model.js";
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
export const validateOtp = async ({
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

    // get the user associated with the OTP
    const otpRecord = await fetchOtp(email, client);

    // ensure a verification request actually exists
    if (!otpRecord) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        reason: "OTP is invalid or expired",
      };
    }

    // verify lifecycle status: used and expired tokens are invalid
    if (otpRecord.used_at || otpRecord.expires_at < new Date()) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "OTP is invalid or expired" };
    }

    // to prevent timing attacks
    const isOtpValid = crypto.timingSafeEqual(
      Buffer.from(otpRecord.otp_hash, "hex"),
      Buffer.from(hashedOTP, "hex"),
    );

    if (!isOtpValid) {
      const newRetryCount = await incrementRetries(
        otpRecord.user_id,
        otpRecord.id,
        client,
      );

      if (!newRetryCount) {
        await client.query("ROLLBACK");
        return {
          ok: false,
          reason: "OTP is invalid or expired",
        };
      }

      // invalidate otps after 5 failed attempts to prevent brute force attacks
      if (newRetryCount >= 5) {
        await invalidateOldOtps(otpRecord.user_id, client);
        await client.query("COMMIT");
        return {
          ok: false,
          reason: "OTP is invalid or expired",
        };
      }

      await client.query("COMMIT");
      return { ok: false, reason: "OTP is invalid or expired" };
    }

    await markUserAsVerified(otpRecord.user_id, client);
    await markTokenAsUsed(otpRecord.id, hashedOTP, client);

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
  const { otp, hashedOTP, expiresAt } = generateOTP();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const verification = await fetchUserForSignup(email, client);

    // if user not found, return generic message to prevent enumeration attacks
    if (!verification) {
      await client.query("ROLLBACK");
      return {
        ok: true,
        message: "If an account exists, a new code has been sent.",
      };
    }

    // handles already verified users
    if (verification.is_verified) {
      await client.query("ROLLBACK");
      await sendAlreadyRegisteredEmail(email);
      return {
        ok: true,
        message: "If an account exists, a new code has been sent.",
      };
    }

    // invalidate all previous tokens for the user before creating a new one
    await invalidateOldOtps(verification.id, client);
    await createSignupOtp(verification.id, hashedOTP, expiresAt, client);

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
