import type { SignupSchema } from "../schemas/auth-schema.js";
import { pool } from "../config/db.js";
import type { User } from "../common/types.js";

export const signupModel = async (
  hashedPassword: string,
  data: Omit<SignupSchema, "password">,
): Promise<Pick<User, "username" | "email">> => {
  const { username, email } = data;

  const query = `
    INSERT INTO users (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING username, email
  `;

  const values = [username, email, hashedPassword];
  const result = await pool.query<Pick<User, "username" | "email">>(
    query,
    values,
  );
  return result.rows[0]!;
};

export const userExistsByEmail = async (email: string): Promise<boolean> => {
  const query = "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)";
  const values = [email];

  const result = await pool.query(query, values);

  return result.rows[0].exists;
};
