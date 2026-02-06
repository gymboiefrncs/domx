import { pool } from "../config/db.js";
import {
  createVerificationToken,
  findToken,
  markTokenUsed,
  markUserVerified,
} from "../models/verification-model.js";
import crypto from "crypto";
import { UnauthorizedError } from "../utils/error.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import { getVerificationStatus } from "../models/auth-model.js";

export const verificationService = async (token: string): Promise<void> => {
  if (typeof token !== "string" || !token.trim())
    throw new UnauthorizedError("Invalid token");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // find the user associated with the token
  const record = await findToken(hashedToken);

  // if no user is found, or is already verified or the token is invalid, expired, or already used, throw an error
  if (
    !record ||
    record.used_at ||
    record.expires_at < new Date() ||
    record.is_verified
  ) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  /**
   * if everything is valid, mark the user as verified and the token as used
   * wrap everthing in a transaction, all or nothing cuh
   */
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await markUserVerified(record.user_id, client);
    await markTokenUsed(hashedToken, client);

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
  if (!verification || verification.is_verified) {
    return { message: "If an account exists, a new code has been sent." };
  }

  // generate new otp
  const otp = crypto.randomBytes(3).toString("hex");
  const token = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  // 3. Update DB and send email
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await createVerificationToken(verification.id, token, expiresAt, client);
    await sendVerificationEmail(verification.email, otp);
    await client.query("COMMIT");
    return { message: "A fresh code has been sent to your email." };
  } finally {
    client.release();
  }
};
