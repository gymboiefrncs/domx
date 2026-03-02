import type { PoolClient } from "pg";
import type { EmailVerification } from "./types.js";
import type { SignupUser } from "../features/auth/auth.types.js";

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

export const fetchUserForSignup = async (
  email: string,
  client: PoolClient,
): Promise<SignupUser | undefined> => {
  const query = `
    SELECT id, is_verified, email 
    FROM users 
    WHERE email = $1 
    FOR UPDATE
  `;
  const values = [email];

  const result = await client.query<SignupUser>(query, values);
  return result.rows[0];
};
