import type { GroupRole } from "@domx/shared";
import type { Pool, PoolClient } from "pg";

export type Params = { displayId: string; groupId: string };
export type GroupResponse<T> = { data: T };
export interface GroupMemberCount {
  member_count: number;
}
export interface GroupWithMemberCount {
  group_id: string;
  member_count: number;
}

export interface AccessContext {
  groupExists: boolean;
  requesterRole: GroupRole | null;
  targetUserId: string | null;
}

export interface AccessContextRow {
  group_exists: boolean;
  requester_role: GroupRole | null;
  target_user_id: string | null;
}

export interface GroupAction {
  targetUserId: string | null;
  requesterRole: GroupRole;
}

// ------ Service - Repository Params ------
export interface GroupQueryParams {
  groupId: string;
  userId: string;
}
export interface GroupQueryWithConParams extends GroupQueryParams {
  con?: Pool | PoolClient;
}
export interface ContextParams extends GroupQueryWithConParams {
  targetDisplayId?: string | null;
}
export interface InsertMemberParams extends GroupQueryWithConParams {
  role?: GroupRole;
}
export interface UpdateMemberRoleParams extends GroupQueryWithConParams {
  role: GroupRole;
}
export interface GetMemberRoleParams extends GroupQueryWithConParams {
  forUpdate?: boolean;
}

export type DeleteMemberParams = GroupQueryWithConParams;
export type UpdateLastSeenParams = GroupQueryParams;
export type HasExistingAdminParams = GroupQueryWithConParams;
export type FindGroupsParams = GroupQueryParams;

// ------  Controller/Handlers - Service Params ------

export interface GroupActionParams {
  groupId: string;
  requesterId: string;
}

export interface GroupMemberActionParams extends GroupActionParams {
  displayId: string;
}

export interface CreateGroupParams {
  groupName: string;
  userId: string;
}

export interface RenameGroupParams extends GroupActionParams {
  groupName: string;
}

export interface GetUserGroupDetailsParams {
  userId: string;
  groupId: string;
}
