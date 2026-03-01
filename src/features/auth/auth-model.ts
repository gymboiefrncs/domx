import type { SignupSchema } from "./auth-schema.js";
import { pool } from "../../config/db.js";
import type {
  AuthIdentity,
  NewUser,
  RefreshTokenRow,
  SignupUser,
  UserRow,
} from "./auth.types.js";
import type { PoolClient } from "pg";

export const createUser = async (
  data: SignupSchema,
  client: PoolClient,
): Promise<NewUser | undefined> => {
  const { email } = data;

  const query = `
    INSERT INTO users(email)
    VALUES ($1)
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email
  `;

  const values = [email];
  const result = await client.query<NewUser>(query, values);
  return result.rows[0];
};

export const fetchUserByEmail = async (
  email: string,
): Promise<UserRow | undefined> => {
  const query = "SELECT * FROM users WHERE email = $1";
  const values = [email];

  const result = await pool.query<UserRow>(query, values);
  return result.rows[0];
};

export const fetchUserById = async (
  id: string,
): Promise<AuthIdentity | undefined> => {
  const query = "SELECT id, role FROM users WHERE id = $1";
  const values = [id];

  const result = await pool.query<AuthIdentity>(query, values);
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

export const createToken = async (
  jti: string,
  userId: string,
  refreshToken: string,
  expiresAt: Date,
): Promise<void> => {
  const query = `
    INSERT INTO refresh_token (jti, user_id, token_hash, expires_at) 
    VALUES ($1, $2, $3, $4)
  `;

  const values = [jti, userId, refreshToken, expiresAt];
  await pool.query(query, values);
};

export const fetchTokenByJti = async (
  jti: string,
): Promise<RefreshTokenRow | undefined> => {
  const query = `SELECT * FROM refresh_token WHERE jti = $1`;

  const value = [jti];
  const result = await pool.query<RefreshTokenRow>(query, value);
  return result.rows[0];
};

export const deleteOldRefreshToken = async (jti: string): Promise<void> => {
  const query = `DELETE FROM refresh_token WHERE jti = $1`;

  const value = [jti];
  await pool.query(query, value);
};

export const updateUserPassword = async (
  userId: string,
  hashedPassword: string,
) => {
  const query = `
      UPDATE users 
      SET password = $1 
      WHERE id = $2 
      AND is_verified = true 
      AND password IS NULL
    `;

  const value = [hashedPassword, userId];
  const result = await pool.query(query, value);

  return result;
};
