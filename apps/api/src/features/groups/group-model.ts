import type { Pool, PoolClient } from "pg";
import type { Group, GroupRoles } from "./group-types.js";
import { pool } from "../../config/db.js";

export const insertGroup = async (
  groupName: string,
  client: PoolClient,
): Promise<{ group_id: string }> => {
  const query = `INSERT INTO groups (name) VALUES ($1) returning *`;
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
  // Lock all member rows first, then count.
  // FOR UPDATE cannot be combined with aggregate functions directly.
  await client.query(
    `SELECT 1 FROM group_members WHERE group_id = $1 FOR UPDATE`,
    [groupId],
  );
  const query = `SELECT COUNT(*)::int AS total FROM group_members WHERE group_id = $1`;
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

export const fetchUserGroups = async (userId: string): Promise<Group[]> => {
  const query = `
    SELECT 
    g.group_id, 
    g.name, 
    gm.role,
    gm.last_seen_at,
    COUNT(p.id) FILTER (WHERE p.created_at > gm.last_seen_at)::int AS unread_count,
    (SELECT COUNT(*) FROM group_members WHERE group_id = g.group_id)::int AS member_count
    FROM group_members gm
    JOIN groups g ON g.group_id = gm.group_id
    LEFT JOIN posts p ON p.group_id = g.group_id
    WHERE gm.user_id = $1
    GROUP BY g.group_id, g.name, gm.role, gm.last_seen_at
    ORDER BY g.name
  `;

  const values = [userId];
  const result = await pool.query(query, values);
  return result.rows;
};

export const updateSeen = async (
  groupId: string,
  userId: string,
  con: Pool | PoolClient = pool,
): Promise<boolean> => {
  const query = `UPDATE group_members SET last_seen_at = NOW() WHERE group_id = $1 AND user_id = $2`;
  const values = [groupId, userId];
  const result = await con.query(query, values);
  return (result.rowCount ?? 0) > 0;
};
