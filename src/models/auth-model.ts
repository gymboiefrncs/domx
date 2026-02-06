import type { SignupSchema } from "../schemas/auth-schema.js";
import { pool } from "../config/db.js";
import type { User } from "../common/types.js";
import type { PoolClient } from "pg";

export const signupModel = async (
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
): Promise<Pick<User, "email" | "password" | "username"> | undefined> => {
  const query = "SELECT email, password, username FROM users WHERE email = $1";

  const values = [email];
  const result = await pool.query<
    Pick<User, "email" | "password" | "username">
  >(query, values);
  return result.rows[0];
};

export const getVerificationStatus = async (
  email: string,
): Promise<Pick<User, "id" | "is_verified" | "email"> | undefined> => {
  const query = "SELECT id, is_verified, email FROM users WHERE email = $1";
  const values = [email];

  const result = await pool.query<Pick<User, "id" | "is_verified" | "email">>(
    query,
    values,
  );
  return result.rows[0];
};
