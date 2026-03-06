import type { Pool, PoolClient } from "pg";
import type { GroupRoles } from "./group-types.js";
import { pool } from "../../config/db.js";

export const insertGroup = async (
  groupName: string,
  client: PoolClient,
): Promise<{ group_id: string }> => {
  const query = `INSERT INTO groups (name) VALUES ($1) returning group_id`;
  const values = [groupName];
  const result = await client.query(query, values);
  return result.rows[0];
};

export const insertMember = async (
  groupId: string,
  userId: string,
  role: GroupRoles = "member",
  con: Pool | PoolClient = pool,
): Promise<void> => {
  const query = `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)`;
  const values = [groupId, userId, role];
  await con.query(query, values);
};

export const fetchUserByDisplayId = async (
  displayId: string,
): Promise<string | undefined> => {
  const query = `SELECT id FROM users WHERE display_id = $1`;
  const values = [displayId];
  const result = await pool.query(query, values);
  return result.rows[0]?.id;
};

export const fetchGroupById = async (
  groupId: string,
): Promise<{ group_id: string } | undefined> => {
  const query = `SELECT group_id FROM groups WHERE group_id = $1`;
  const values = [groupId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const fetchMemberRole = async (
  groupId: string,
  userId: string,
): Promise<GroupRoles | undefined> => {
  const query = `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`;
  const values = [groupId, userId];
  const result = await pool.query(query, values);
  return result.rows[0]?.role;
};

export const deleteMember = async (
  userId: string,
  groupId: string,
): Promise<boolean> => {
  const query = `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`;
  const values = [groupId, userId];
  const result = await pool.query(query, values);
  return (result.rowCount ?? 0) > 0;
};
