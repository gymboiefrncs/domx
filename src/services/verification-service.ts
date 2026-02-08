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
import { ValidationError } from "../utils/error.js";
import {
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "../utils/sendEmail.js";
import { getVerificationStatus } from "../models/auth-model.js";
import { generateOTP } from "../utils/generateOTP.js";

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
}): Promise<void> => {
  // hash the incoming OTP to compare against the stored hash
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // find the user associated with the OTP
    const record = await findToken(email, hashedOTP, client);
    console.log("Verification record found:", record);
    // ensure a verification request actually exists
    if (!record) {
      throw new ValidationError("No verification request found for this email");
    }

    // verify lifecyle status: used and expired tokens are invalid
    if (record.used_at || record.expires_at < new Date()) {
      throw new ValidationError("Invalid or expired OTP");
    }

    // invalidate all tokens after 5 failed attempts to prevent brute force attacks
    if (record.retries >= 5) {
      await invalidateAllTokensForUser(record.user_id, client);
      await client.query("COMMIT");
      throw new ValidationError(
        "Maximum verification attempts exceeded. Please request a new OTP.",
      );
    }

    if (record.otp_hash !== hashedOTP) {
      console.log("this run");
      await incrementTokenRetries(record.user_id, client);
      await client.query("COMMIT");
      throw new ValidationError("Invalid OTP");
    }

    await markUserVerified(record.user_id, client);
    await markTokenUsed(hashedOTP, client);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// re-issues a verification code for unverified users.
export const resendVerificationService = async (email: string) => {
  const verification = await getVerificationStatus(email);

  // if user not found, return generic message to prevent enumarationn attacks
  if (!verification) {
    return { message: "If an account exists, a new code has been sent." };
  }

  // handles already verified users
  if (verification.is_verified) {
    await sendAlreadyRegisteredEmail(email);
    return { message: "If an account exists, a new code has been sent." };
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

    return { message: "If an account exists, a new code has been sent." };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
