import { pool } from "../config/db.js";
import {
  createVerificationToken,
  findToken,
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

export const verificationService = async (otp: string): Promise<void> => {
  if (typeof otp !== "string" || !otp.trim())
    throw new ValidationError("Invalid OTP");

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // find the user associated with the OTP
    const record = await findToken(hashedOTP, client);

    // if no user is found, or is already verified or the OTP is invalid, expired, or already used, throw an error
    if (
      !record ||
      record.used_at ||
      record.expires_at < new Date() ||
      record.is_verified
    ) {
      throw new ValidationError("Invalid or expired OTP");
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

export const resendVerificationService = async (email: string) => {
  const verification = await getVerificationStatus(email);
  if (!verification) {
    return { message: "If an account exists, a new code has been sent." };
  }

  if (verification.is_verified) {
    await sendAlreadyRegisteredEmail(email);
    return { message: "If an account exists, a new code has been sent." };
  }

  // generate new otp
  const { otp, hashedOTP, expiresAt } = generateOTP();

  // 3. Update DB and send email
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
