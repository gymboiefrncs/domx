import type { PoolClient } from "pg";
import type { GroupRoles } from "./group-types.js";

export const insertGroup = async (
  groupName: string,
  client: PoolClient,
): Promise<{ group_id: number }> => {
  const query = `INSERT INTO groups (name) VALUES ($1) returning group_id`;
  const values = [groupName];
  const result = await client.query(query, values);
  return result.rows[0];
};

export const insertMember = async (
  groupId: number,
  userId: string,
  role: GroupRoles,
  client: PoolClient,
): Promise<void> => {
  const query = `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)`;
  const values = [groupId, userId, role];
  await client.query(query, values);
};
