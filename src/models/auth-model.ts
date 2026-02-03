import type { SignupSchema } from "../schemas/auth-schema.js";
import { pool } from "../config/db.js";

export const signupModel = async (
  hashedPassword: string,
  data: Omit<SignupSchema, "password">,
): Promise<Omit<SignupSchema, "id" | "password">> => {
  const { username, email } = data;

  const query = `
    INSERT INTO users (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING username, email
  `;

  const values = [username, email, hashedPassword];
  const result = await pool.query<Omit<SignupSchema, "id">>(query, values);
  return result.rows[0]!;
};
