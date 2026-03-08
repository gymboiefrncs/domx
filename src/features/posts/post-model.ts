import { pool } from "../../config/db.js";
import type { Post } from "./post-types.js";

export const fetchAllPostsByGroupId = async (
  groupId: string,
): Promise<Post[]> => {
  const query = `
  SELECT p.*, u.username, u.display_id 
  FROM posts p 
  JOIN users u 
  ON p.user_id = u.id
  WHERE p.group_id = $1`;
  const values = [groupId];

  const result = await pool.query(query, values);
  return result.rows;
};

export const insertPost = async (
  body: string,
  userId: string,
  groupId: string,
): Promise<void> => {
  const query = `INSERT INTO posts (body, user_id, group_id) VALUES ($1, $2, $3)`;
  const values = [body, userId, groupId];
  await pool.query(query, values);
};

export const fetchPostById = async (
  postId: string,
  groupId: string,
): Promise<{ id: string; user_id: string } | undefined> => {
  const query = `SELECT id, user_id FROM posts WHERE id = $1 AND group_id = $2`;
  const values = [postId, groupId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updatePost = async (
  body: string,
  postId: string,
  groupId: string,
): Promise<void> => {
  const query = `UPDATE posts SET body = $1 WHERE id = $2 AND group_id = $3`;
  const values = [body, postId, groupId];
  await pool.query(query, values);
};

export const deletePost = async (postid: string, groupId: string) => {
  const query = `DELETE FROM posts WHERE id = $1 AND group_id = $2`;

  const values = [postid, groupId];
  await pool.query(query, values);
};
