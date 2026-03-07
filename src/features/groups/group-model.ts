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
  con: Pool | PoolClient = pool,
  forUpdate = false,
): Promise<GroupRoles | undefined> => {
  const query = `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2${forUpdate ? " FOR UPDATE" : ""}`;
  const values = [groupId, userId];
  const result = await con.query(query, values);
  return result.rows[0]?.role;
};

export const deleteMember = async (
  userId: string,
  groupId: string,
  con: Pool | PoolClient = pool,
): Promise<boolean> => {
  const query = `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`;
  const values = [groupId, userId];
  const result = await con.query(query, values);
  return (result.rowCount ?? 0) > 0;
};

export const updateRole = async (
  role: GroupRoles,
  userId: string,
  groupId: string,
  con: Pool | PoolClient = pool,
): Promise<boolean> => {
  const query = `UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3`;
  const values = [role, groupId, userId];

  const result = await con.query(query, values);
  return (result.rowCount ?? 0) > 0;
};

export const hasOtherAdmins = async (
  groupId: string,
  userId: string,
  con: Pool | PoolClient = pool,
): Promise<boolean> => {
  const query = `SELECT 1 FROM group_members WHERE role = 'admin' AND group_id = $1 AND user_id != $2 FOR UPDATE`;
  const values = [groupId, userId];
  const result = await con.query(query, values);
  return (result.rowCount ?? 0) > 0;
};

export const countMembers = async (
  groupId: string,
  client: PoolClient,
): Promise<number> => {
  const query = `SELECT COUNT(*)::int AS total FROM group_members WHERE group_id = $1 FOR UPDATE`;
  const values = [groupId];
  const result = await client.query(query, values);
  return result.rows[0].total;
};

export const deleteGroup = async (
  groupId: string,
  client: PoolClient,
): Promise<boolean> => {
  const query = `DELETE FROM groups WHERE group_id = $1`;
  const values = [groupId];
  const result = await client.query(query, values);
  return (result.rowCount ?? 0) > 0;
};
