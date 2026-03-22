import { pool } from "@api/config/db.js";
import type { User } from "@domx/shared";

export const getProfile = async (userId: string): Promise<User> => {
  const query = `SELECT username, email, display_id FROM users WHERE id = $1`;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};
