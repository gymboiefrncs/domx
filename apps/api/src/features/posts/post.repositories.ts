import { pool } from "@api/shared/db/db.js";
import type { PostDetails } from "@domx/shared";
import type { EditPost } from "./post.types.js";

export const fetchAllPostsByGroupId = async (
  groupId: string,
): Promise<PostDetails[]> => {
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
  title: string,
  body: string,
  userId: string,
  groupId: string,
): Promise<PostDetails> => {
  const query = `
  WITH inserted_post AS (
    INSERT INTO posts (title, body, user_id, group_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  )
  SELECT p.*, u.username, u.display_id
  FROM inserted_post p
  JOIN users u ON p.user_id = u.id`;
  const values = [title, body, userId, groupId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const fetchPostById = async (
  postId: string,
  groupId: string,
): Promise<EditPost | undefined> => {
  const query = `SELECT id, user_id FROM posts WHERE id = $1 AND group_id = $2`;
  const values = [postId, groupId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updatePost = async (
  title: string,
  body: string,
  postId: string,
  groupId: string,
): Promise<void> => {
  const query = `
  UPDATE posts 
  SET title = coalesce($1, title), 
      body = coalesce($2, body), 
      updated_at = now()
  WHERE id = $3 AND group_id = $4`;
  const values = [title, body, postId, groupId];
  await pool.query(query, values);
};

export const deletePost = async (
  postId: string,
  groupId: string,
): Promise<void> => {
  const query = `DELETE FROM posts WHERE id = $1 AND group_id = $2`;

  const values = [postId, groupId];
  await pool.query(query, values);
};
