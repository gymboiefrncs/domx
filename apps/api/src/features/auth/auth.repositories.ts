import type { SignupSchema } from "./auth.schemas.js";
import { pool } from "../../shared/db/db.js";
import type { UserRole, LoginUser, NewUser, SignupUser } from "./auth.types.js";
import type { Pool, PoolClient } from "pg";
import type { Role } from "@domx/shared";

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
): Promise<LoginUser | undefined> => {
  const query =
    "SELECT id, email,password, is_verified, role FROM users WHERE email = $1";
  const values = [email];

  const result = await pool.query<LoginUser>(query, values);
  return result.rows[0];
};

export const fetchUserById = async (
  id: string,
): Promise<UserRole | undefined> => {
  const query = "SELECT role FROM users WHERE id = $1";
  const values = [id];

  const result = await pool.query<UserRole>(query, values);
  return result.rows[0];
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
  const query = `SELECT 1 FROM refresh_token WHERE jti = $1`;

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

export const updateUserPassword = async (
  userId: string,
  hashedPassword: string,
  client: PoolClient,
): Promise<boolean> => {
  const query = `
      UPDATE users 
      SET password = $1 
      WHERE id = $2 
      AND is_verified = true 
      AND password IS NULL
    `;

  const value = [hashedPassword, userId];
  const result = await client.query(query, value);

  return (result.rowCount ?? 0) > 0;
};

export const createDisplayId = async (
  userId: string,
  displayId: string,
  client: PoolClient,
): Promise<Role | null> => {
  const query = `
    UPDATE users 
    SET display_id = $1
    WHERE id = $2
    RETURNING role
  `;
  const values = [displayId, userId];
  const result = await client.query(query, values);

  return result.rows[0]?.role ?? null;
};

export const fetchUserForSignup = async (
  email: string,
  client: PoolClient,
): Promise<SignupUser | undefined> => {
  const query = `
    SELECT id, is_verified, email, username, password
    FROM users 
    WHERE email = $1 
    FOR UPDATE
  `;
  const values = [email];

  const result = await client.query<SignupUser>(query, values);
  return result.rows[0];
};

export const updateUsername = async (
  userId: string,
  username: string,
  client: PoolClient,
): Promise<boolean> => {
  const query = `
    UPDATE users SET username=$1 
    WHERE id=$2
  `;
  const values = [username, userId];
  const result = await client.query(query, values);

  return (result.rowCount ?? 0) > 0;
};
