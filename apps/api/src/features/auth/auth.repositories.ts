import type { SignupRequest } from "./auth.types.js";
import { pool } from "@api/shared/db/db.js";
import type {
  UserIdentity,
  LoginUser,
  NewUser,
  SignupUser,
} from "./auth.types.js";
import type { Pool, PoolClient } from "pg";

export const createUser = async (
  data: SignupRequest,
  client: PoolClient,
): Promise<NewUser | null> => {
  const { email } = data;

  const query = `
    INSERT INTO users(email)
    VALUES ($1)
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email
  `;

  const values = [email];
  const result = await client.query<NewUser>(query, values);
  return result.rows[0] ?? null;
};

export const fetchUserByEmail = async (
  email: string,
): Promise<LoginUser | null> => {
  const query =
    "SELECT id, email,password, is_verified FROM users WHERE email = $1";
  const values = [email];

  const result = await pool.query<LoginUser>(query, values);
  return result.rows[0] ?? null;
};

export const fetchUserById = async (
  id: string,
): Promise<UserIdentity | null> => {
  const query = "SELECT id FROM users WHERE id = $1";
  const values = [id];

  const result = await pool.query<UserIdentity>(query, values);
  return result.rows[0] ?? null;
};

export const createToken = async (
  jti: string,
  userId: string,
  refreshTokenHash: string,
  expiresAt: Date,
  con: PoolClient | Pool = pool,
): Promise<void> => {
  const query = `
    INSERT INTO refresh_token (jti, user_id, token_hash, expires_at) 
    VALUES ($1, $2, $3, $4)
  `;

  const values = [jti, userId, refreshTokenHash, expiresAt];
  await con.query(query, values);
};

export const tokenExists = async (jti: string): Promise<boolean> => {
  const query = "SELECT 1 FROM refresh_token WHERE jti = $1";

  const value = [jti];
  const result = await pool.query(query, value);
  return (result.rowCount ?? 0) > 0;
};

export const deleteOldRefreshToken = async (
  jti: string,
  con: PoolClient | Pool = pool,
): Promise<void> => {
  const query = `DELETE FROM refresh_token WHERE jti = $1`;

  const value = [jti];
  await con.query(query, value);
};

export const setUserInfoOnce = async (
  userId: string,
  username: string,
  hashedPassword: string,
  displayId: string,
): Promise<boolean> => {
  const query = `
    UPDATE users
    SET password = $1,
        username = $2,
        display_id = $3
    WHERE id = $4
      AND is_verified = true
      AND password IS NULL
    RETURNING id
  `;

  const values = [hashedPassword, username, displayId, userId];
  const result = await pool.query(query, values);

  return (result.rowCount ?? 0) > 0;
};

export const fetchUserForSignup = async (
  email: string,
  client: PoolClient,
): Promise<SignupUser | null> => {
  const query = `
    SELECT id, is_verified, email, username, password
    FROM users 
    WHERE email = $1 
    FOR UPDATE
  `;
  const values = [email];

  const result = await client.query<SignupUser>(query, values);
  return result.rows[0] ?? null;
};
