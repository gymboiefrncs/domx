import type { PoolClient } from "pg";
import type {
  EmailVerification,
  UserVerificationStatus,
} from "../../common/types.js";

export const createSignupOtp = async (
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

export const incrementRetries = async (
  userId: string,
  id: string,
  client: PoolClient,
): Promise<number | undefined> => {
  const query = `
    UPDATE email_verification 
    SET retries = retries + 1 
    WHERE user_id = $1 AND id = $2 
    RETURNING retries
  `;

  const values = [userId, id];
  const result = await client.query<{ retries: number }>(query, values);
  return result.rows[0]?.retries;
};

export const fetchOtp = async (
  email: string,
  client: PoolClient,
): Promise<UserVerificationStatus | undefined> => {
  const query = `
    SELECT ev.id, ev.user_id, ev.expires_at, ev.otp_hash, ev.used_at, ev.retries, u.is_verified
    FROM email_verification ev 
    JOIN users u ON ev.user_id = u.id 
    WHERE u.email = $1 
    ORDER BY ev.created_at 
    DESC 
    LIMIT 1 
    FOR UPDATE OF ev
  `;

  const value = [email];
  const result = await client.query<UserVerificationStatus>(query, value);
  return result.rows[0];
};

export const markUserAsVerified = async (
  userId: string,
  client: PoolClient,
): Promise<void> => {
  const query = `UPDATE users SET is_verified = true WHERE id = $1`;
  const value = [userId];

  await client.query(query, value);
};

export const deleteOtp = async (
  userId: string,
  client: PoolClient,
): Promise<void> => {
  const query = `
    DELETE FROM email_verification
    WHERE user_id = $1 
  `;

  const value = [userId];
  await client.query(query, value);
};

export const getLatestOTP = async (
  userId: string,
  client: PoolClient,
): Promise<EmailVerification | undefined> => {
  const query = `
    SELECT * FROM email_verification 
    WHERE user_id = $1 
    ORDER BY created_at 
    DESC 
    LIMIT 1 
    FOR UPDATE
  `;

  const value = [userId];
  const result = await client.query<EmailVerification>(query, value);
  return result.rows[0];
};
