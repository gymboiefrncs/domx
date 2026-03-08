import { pool } from "../../config/db.js";

export const insertPost = async (
  body: string,
  userId: string,
  groupId: string,
): Promise<void> => {
  const query = `INSERT INTO posts (body, user_id, group_id) VALUES ($1, $2, $3)`;
  const values = [body, userId, groupId];
  await pool.query(query, values);
};

export const updatePost = async () => {};
