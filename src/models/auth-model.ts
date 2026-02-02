import type { SignupSchema } from "../schemas/auth-schema.js";
import { pool } from "../config/db.js";

export const signupModel = async (data: SignupSchema) => {
  const { username, email, password } = data;
  console.log(typeof password);
  const query = `
    INSERT INTO users (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, username, email
  `;
  const values = [username, email, password];
  const result = await pool.query(query, values);
  return result.rows[0];
};
