import { pool } from "../config/db.js";
import {
  findToken,
  markTokenUsed,
  markUserVerified,
} from "../models/verification-model.js";
import crypto from "crypto";
import { UnauthorizedError } from "../utils/error.js";

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
