import { pool } from "../config/db.js";
import type { PostSchema } from "../schemas/post-schema.js";

export const createPostModel = async (userId: string, data: PostSchema) => {
  const query = `INSERT INTO posts(author_id, title, content) VALUES($1, $2, $3) RETURNING *`;

  const values = [userId, data.title, data.content];
  const result = await pool.query(query, values);

  return result.rows[0];
};
