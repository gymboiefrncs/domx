import type { SignupSchema } from "../schemas/auth-schema.js";
import { pool } from "../config/db.js";
import type { EmailVerification, User } from "../common/types.js";
import type { PoolClient } from "pg";

export const createUser = async (
  hashedPassword: string,
  data: Omit<SignupSchema, "password">,
  client: PoolClient,
): Promise<Pick<User, "id" | "email">> => {
  const { username, email } = data;

  const query = `
    INSERT INTO users (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, email
  `;

  const values = [username, email, hashedPassword];
  const result = await client.query<Pick<User, "id" | "email">>(query, values);
  return result.rows[0]!;
};

export const getUserByEmail = async (
  email: string,
): Promise<User | undefined> => {
  const query = "SELECT * FROM users WHERE email = $1";

  const values = [email];
  const result = await pool.query<User>(query, values);
  return result.rows[0];
};

export const getUserById = async (
  id: string,
): Promise<Pick<User, "id" | "role"> | undefined> => {
  const query = "SELECT id, role FROM users WHERE id = $1";
  const result = await pool.query<Pick<User, "id" | "role">>(query, [id]);
  return result.rows[0];
};

export const fetchUserForSignup = async (
  email: string,
  client: PoolClient,
): Promise<Pick<User, "id" | "is_verified" | "email"> | undefined> => {
  const query =
    "SELECT id, is_verified, email FROM users WHERE email = $1 FOR UPDATE";
  const values = [email];

  const result = await client.query<Pick<User, "id" | "is_verified" | "email">>(
    query,
    values,
  );
  return result.rows[0];
};

export const insertToken = async (
  jti: string,
  userId: string,
  refreshToken: string,
  expiresAt: Date,
): Promise<void> => {
  const query = `INSERT INTO refresh_token (jti, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)`;
  await pool.query(query, [jti, userId, refreshToken, expiresAt]);
};

export const getTokenByJTI = async (jti: string) => {
  const query = `SELECT * FROM refresh_token WHERE jti = $1`;
  const result = await pool.query(query, [jti]);
  return result.rows[0];
};

export const deleteOldRefreshToken = async (jti: string): Promise<void> => {
  const query = `DELETE FROM refresh_token WHERE jti = $1`;
  await pool.query(query, [jti]);
};

export const getLatestOTP = async (
  userId: string,
  client: PoolClient,
): Promise<EmailVerification | undefined> => {
  const query = `SELECT * FROM email_verification WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE`;
  const result = await client.query<EmailVerification>(query, [userId]);
  return result.rows[0];
};
