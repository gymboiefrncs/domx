import type { Pool, PoolClient } from "pg";
import type { CreateGroup, NewMember } from "@domx/shared";
import type { GroupDetail, GroupRole } from "@domx/shared";
import { pool } from "@api/config/db.js";

export const insertGroup = async (
  groupName: string,
  client: PoolClient,
): Promise<CreateGroup> => {
  const query = `INSERT INTO groups (name) VALUES ($1) returning group_id`;
  const values = [groupName];
  const result = await client.query(query, values);
  return result.rows[0];
};

export const updateGroupName = async (
  groupId: string,
  groupName: string,
): Promise<void> => {
  const query = `UPDATE groups SET name = $1 WHERE group_id = $2`;
  const values = [groupName, groupId];

  await pool.query(query, values);
};

export const insertMember = async (
  groupId: string,
  userId: string,
  role: GroupRole = "member",
  con: Pool | PoolClient = pool,
): Promise<NewMember> => {
  const query = `
    WITH inserted AS (
      INSERT INTO group_members (group_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING user_id, role, group_id
    )
    SELECT i.role, i.group_id, u.display_id, u.username
    FROM inserted i
    JOIN users u ON u.id = i.user_id
  `;
  const values = [groupId, userId, role];
  const result = await con.query(query, values);
  return result.rows[0];
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
): Promise<GroupRole | undefined> => {
  const query = `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2${forUpdate ? " FOR UPDATE" : ""}`;
  const values = [groupId, userId];
  const result = await con.query(query, values);
  return result.rows[0]?.role;
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
  role: GroupRole,
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
  con: PoolClient | Pool = pool,
): Promise<boolean> => {
  const query = `DELETE FROM groups WHERE group_id = $1`;
  const values = [groupId];
  const result = await con.query(query, values);
  return (result.rowCount ?? 0) > 0;
};

export const fetchUserGroups = async (
  userId: string,
): Promise<GroupDetail[]> => {
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
    ORDER BY g.created_at DESC
  `;

  const values = [userId];
  const result = await pool.query(query, values);
  return result.rows;
};

export const fetchGroupMembers = async (
  groupId: string,
): Promise<NewMember[]> => {
  const query = `SELECT gm.role, u.display_id, u.username
  FROM group_members gm
  JOIN users u on u.id = gm.user_id
  WHERE gm.group_id = $1`;
  const values = [groupId];
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
