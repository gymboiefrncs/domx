import { pool } from "@api/shared/db/db.js";
import type { ThreadDetails } from "@domx/shared";
import type {
  EditThread,
  RepoInsertThreadParams,
  RepoThreadIdentity,
  RepoUpdateThreadParams,
} from "./thread.types.js";

export const getAllThreads = async (
  groupId: string,
): Promise<ThreadDetails[]> => {
  const query = `
  SELECT t.*, u.username, u.display_id 
  FROM threads t
  JOIN users u 
  ON t.user_id = u.id
  WHERE t.group_id = $1`;

  const result = await pool.query<ThreadDetails>(query, [groupId]);
  return result.rows;
};

export const findThreadById = async ({
  threadId,
  groupId,
}: RepoThreadIdentity): Promise<EditThread | null> => {
  const query = `SELECT id, user_id 
      FROM threads 
      WHERE id = $1 
      AND group_id = $2`;
  const result = await pool.query<EditThread>(query, [threadId, groupId]);
  return result.rows[0] ?? null;
};

// --- WRITE OPERATIONS ---

export const insertThread = async ({
  title,
  content,
  userId,
  groupId,
}: RepoInsertThreadParams): Promise<ThreadDetails> => {
  const query = `
  WITH inserted_thread AS (
    INSERT INTO threads (title, content, user_id, group_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  )
  SELECT t.*, u.username, u.display_id
  FROM inserted_thread t
  JOIN users u ON t.user_id = u.id`;
  const result = await pool.query<ThreadDetails>(query, [
    title,
    content,
    userId,
    groupId,
  ]);
  return result.rows[0]!;
};

export const updateThread = async ({
  threadId,
  groupId,
  title,
  content,
}: RepoUpdateThreadParams): Promise<ThreadDetails | null> => {
  const query = `
  WITH updated_thread AS (
    UPDATE threads
    SET title = coalesce($1, title),
        content = coalesce($2, content),
        updated_at = now()
    WHERE id = $3 AND group_id = $4
    RETURNING *
  )
  SELECT t.*, u.username, u.display_id
  FROM updated_thread t
  JOIN users u ON t.user_id = u.id`;
  const values = [title, content, threadId, groupId];
  const result = await pool.query<ThreadDetails>(query, values);
  return result.rows[0] ?? null;
};

export const deleteThread = async ({
  threadId,
  groupId,
}: RepoThreadIdentity): Promise<ThreadDetails | null> => {
  const query = `DELETE 
      FROM threads 
      WHERE id = $1 
      AND group_id = $2 
      RETURNING *`;
  const result = await pool.query<ThreadDetails>(query, [threadId, groupId]);
  return result.rows[0] ?? null;
};
