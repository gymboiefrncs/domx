import type { PoolClient } from "pg";
import { pool } from "../config/db.js";
import type { UserVerificationStatus } from "../common/types.js";

export const createVerificationToken = async (
  userId: string,
  token: string,
  expiresAt: Date,
  client: PoolClient,
): Promise<void> => {
  const query = `
    INSERT INTO email_verification (user_id, token, expires_at)
    VALUES ($1, $2, $3)
  `;
  const values = [userId, token, expiresAt];
  await client.query(query, values);
};

export const findToken = async (
  token: string,
): Promise<UserVerificationStatus | undefined> => {
  const query = `SELECT ev.user_id, ev.expires_at, ev.token, ev.used_at, u.is_verified 
  FROM email_verification ev 
  JOIN users u ON ev.user_id = u.id 
  WHERE ev.token = $1`;

  const values = [token];
  const result = await pool.query<UserVerificationStatus>(query, values);
  return result.rows[0];
};

export async function markTokenUsed(
  token: string,
  client: PoolClient,
): Promise<void> {
  await client.query(
    `UPDATE email_verification SET used_at = NOW() WHERE token = $1`,
    [token],
  );
}

export async function markUserVerified(
  userId: string,
  client: PoolClient,
): Promise<void> {
  await client.query(`UPDATE users SET is_verified = true WHERE id = $1`, [
    userId,
  ]);
}
