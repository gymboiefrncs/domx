import type { PoolClient } from "pg";
import type { UserVerificationStatus } from "../common/types.js";

export const createVerificationToken = async (
  userId: string,
  hashedOTP: string,
  expiresAt: Date,
  client: PoolClient,
): Promise<void> => {
  const query = `
    INSERT INTO email_verification (user_id, otp_hash, expires_at)
    VALUES ($1, $2, $3)
  `;
  const values = [userId, hashedOTP, expiresAt];
  await client.query(query, values);
};

export const incrementTokenRetries = async (
  userId: string,
  client: PoolClient,
): Promise<number | undefined> => {
  const query = `UPDATE email_verification SET retries = retries + 1 WHERE user_id = $1 RETURNING retries`;
  const values = [userId];
  const result = await client.query<{ retries: number }>(query, values);
  return result.rows[0]?.retries;
};

export const findToken = async (
  email: string,
  hashedOTP: string,
  client: PoolClient,
): Promise<UserVerificationStatus | undefined> => {
  const query = `SELECT ev.user_id, ev.expires_at, ev.otp_hash, ev.used_at, ev.retries, u.is_verified
  FROM email_verification ev 
  JOIN users u ON ev.user_id = u.id 
  WHERE u.email = $1 AND ev.otp_hash = $2`;

  const values = [email, hashedOTP];
  const result = await client.query<UserVerificationStatus>(query, values);
  return result.rows[0];
};

export const markTokenUsed = async (
  hashedOTP: string,
  client: PoolClient,
): Promise<void> => {
  await client.query(
    `UPDATE email_verification SET used_at = NOW() WHERE otp_hash = $1`,
    [hashedOTP],
  );
};

export const markUserVerified = async (
  userId: string,
  client: PoolClient,
): Promise<void> => {
  await client.query(`UPDATE users SET is_verified = true WHERE id = $1`, [
    userId,
  ]);
};

export const invalidateAllTokensForUser = async (
  userId: string,
  client: PoolClient,
): Promise<void> => {
  await client.query(
    `UPDATE email_verification SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
    [userId],
  );
};
