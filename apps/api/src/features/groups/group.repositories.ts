import type { Pool, PoolClient } from "pg";
import type { CreateGroup, Member } from "@domx/shared";
import type { Group, GroupRole } from "@domx/shared";
import { pool } from "@api/shared/db/db.js";
import type {
  AccessContext,
  AccessContextRow,
  ContextParams,
  DeleteMemberParams,
  GetMemberRoleParams,
  FindGroupsParams,
  HasExistingAdminParams,
  InsertMemberParams,
  UpdateLastSeenParams,
  UpdateMemberRoleParams,
} from "./group.types.js";
import { SELECT_GROUP_DETAILS_FIELDS } from "./group.constants.js";

export const getAccessContext = async ({
  groupId,
  userId,
  targetDisplayId = null,
  con = pool,
}: ContextParams): Promise<AccessContext> => {
  const query = `
    SELECT 
      EXISTS(SELECT 1 FROM groups WHERE group_id = $1) AS group_exists,
      (SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2) AS requester_role,
      (SELECT id FROM users WHERE display_id = $3) AS target_user_id;
  `;
  const result = await con.query<AccessContextRow>(query, [
    groupId,
    userId,
    targetDisplayId,
  ]);

  return {
    groupExists: result.rows[0]?.group_exists ?? false,
    requesterRole: result.rows[0]?.requester_role ?? null,
    targetUserId: result.rows[0]?.target_user_id ?? null,
  };
};

// ---  GROUP WRITE OPERATIONS ---

export const insertGroup = async (
  groupName: string,
  client: PoolClient,
): Promise<CreateGroup> => {
  const query = `INSERT INTO groups (name) VALUES ($1) returning group_id`;
  const result = await client.query<CreateGroup>(query, [groupName]);
  return result.rows[0]!;
};

export const updateName = async (
  groupId: string,
  groupName: string,
): Promise<void> => {
  const query = `UPDATE groups SET name = $1 WHERE group_id = $2`;
  await pool.query(query, [groupName, groupId]);
};

export const deleteGroup = async (
  groupId: string,
  con: PoolClient | Pool = pool,
): Promise<boolean> => {
  const query = `DELETE FROM groups WHERE group_id = $1`;
  const result = await con.query(query, [groupId]);
  return (result.rowCount ?? 0) > 0;
};

// --- MEMBER WRITE OPERATIONS ---

export const insertMember = async ({
  groupId,
  userId,
  role = "member",
  con = pool,
}: InsertMemberParams): Promise<Member> => {
  // used CTE here to avoid making 2 separate queries
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
  const result = await con.query<Member>(query, values);
  return result.rows[0]!;
};

export const deleteMember = async ({
  userId,
  groupId,
  con = pool,
}: DeleteMemberParams): Promise<void> => {
  const query = `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`;
  await con.query(query, [groupId, userId]);
};

export const updateMemberRole = async ({
  role,
  userId,
  groupId,
  con = pool,
}: UpdateMemberRoleParams): Promise<void> => {
  const query = `UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3`;
  await con.query(query, [role, groupId, userId]);
};

export const updateLastSeen = async ({
  userId,
  groupId,
}: UpdateLastSeenParams): Promise<{ last_seen_at: Date }> => {
  const query = `
  UPDATE group_members
  SET last_seen_at = NOW()
  WHERE user_id = $1 AND group_id = $2
  RETURNING last_seen_at
  `;
  const result = await pool.query<{ last_seen_at: Date }>(query, [
    userId,
    groupId,
  ]);
  return result.rows[0]!;
};

// --- READ AND LOCK QUERIES ---

export const hasExistingAdmin = async ({
  groupId,
  userId,
  con = pool,
}: HasExistingAdminParams): Promise<boolean> => {
  const query = `SELECT 1 FROM group_members WHERE role = 'admin' AND group_id = $1 AND user_id != $2 FOR UPDATE`;
  const values = [groupId, userId];
  const result = await con.query(query, values);
  return (result.rowCount ?? 0) > 0;
};

export const countMembers = async (
  groupId: string,
  con: PoolClient | Pool = pool,
  forUpdate: boolean = false,
): Promise<number> => {
  // Lock all member rows first, then count.
  // FOR UPDATE cannot be combined with aggregate functions directly.
  if (forUpdate) {
    await con.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 FOR UPDATE`,
      [groupId],
    );
  }
  const query = `SELECT COUNT(*)::int AS total FROM group_members WHERE group_id = $1`;
  const result = await con.query<{ total: number }>(query, [groupId]);
  return result.rows[0]!.total;
};

export const doesGroupExist = async (
  groupId: string,
  con: Pool | PoolClient = pool,
): Promise<boolean> => {
  const query = `SELECT 1 FROM groups WHERE group_id = $1`;
  const values = [groupId];
  const result = await con.query(query, values);
  return (result.rowCount ?? 0) > 0;
};

export const getMemberRole = async ({
  groupId,
  userId,
  con = pool,
  forUpdate = false,
}: GetMemberRoleParams): Promise<GroupRole | null> => {
  const query = `SELECT role 
      FROM group_members 
      WHERE group_id = $1 
      AND user_id = $2
      ${forUpdate ? " FOR UPDATE" : ""}`;
  const result = await con.query<{ role: GroupRole }>(query, [groupId, userId]);
  return result.rows[0]?.role ?? null;
};

export const findUserIdByDisplayId = async (
  displayId: string,
): Promise<string | null> => {
  const query = `SELECT id FROM users WHERE display_id = $1`;
  const result = await pool.query<{ id: string }>(query, [displayId]);
  return result.rows[0]?.id ?? null;
};

export const findGroupsByUserId = async (userId: string): Promise<Group[]> => {
  const query = `
    ${SELECT_GROUP_DETAILS_FIELDS}
    FROM group_members gm
    JOIN groups g ON g.group_id = gm.group_id
    WHERE gm.user_id = $1
    ORDER BY g.created_at DESC;`;
  const result = await pool.query<Group>(query, [userId]);
  return result.rows;
};

export const findGroupDetails = async ({
  userId,
  groupId,
}: FindGroupsParams): Promise<Group> => {
  const query = `
  ${SELECT_GROUP_DETAILS_FIELDS}
    FROM group_members gm
    JOIN groups g ON g.group_id = gm.group_id
    WHERE gm.user_id = $1 AND g.group_id = $2
  `;

  const result = await pool.query<Group>(query, [userId, groupId]);
  return result.rows[0]!;
};

export const findGroupMembers = async (groupId: string): Promise<Member[]> => {
  const query = `
  SELECT gm.role, u.id, u.display_id, u.username
  FROM group_members gm
  JOIN users u on u.id = gm.user_id
  WHERE gm.group_id = $1
  `;
  const result = await pool.query<Member>(query, [groupId]);
  return result.rows;
};

// TODO: fix violations: Duplicated function blocks/ Primitive Obsession/ String heavy function arguments
