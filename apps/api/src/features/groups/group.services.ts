import { withTransaction } from "@api/shared/db/transaction.js";
import {
  countMembers,
  deleteGroup,
  deleteMember,
  hasOtherAdmins,
  fetchUserByDisplayId,
  fetchUserGroups,
  insertGroup,
  insertMember,
  updateRole,
  updateSeen,
  updateGroupName,
  fetchGroupMembers,
  fetchMemberRole,
  fetchGroupById,
} from "./group.repositories.js";
import { pool } from "@api/shared/db/db.js";
import { GROUP_ERROR, GROUP_SUCCESS } from "./group.constants.js";
import { PROFILE_ERROR } from "@api/features/profile/index.js";
import type { Result } from "@api/shared/types/types.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/shared/error.js";
import { resolveGroupAction } from "./group-helper.js";
import type { CreateGroup, GroupDetail, NewMember } from "@domx/shared";

export const getGroupMembers = async (
  groupId: string,
  requesterId: string,
): Promise<Result<NewMember[]>> => {
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_ERROR.NOT_FOUND);

  const requesterRole = await fetchMemberRole(groupId, requesterId);
  if (!requesterRole) throw new ForbiddenError(GROUP_ERROR.NOT_A_MEMBER);

  const members = await fetchGroupMembers(groupId);
  return {
    ok: true,
    message: "Group members fetched successfully.",
    data: members,
  };
};

export const getUserGroups = async (
  userId: string,
): Promise<Result<GroupDetail[]>> => {
  const groups = await fetchUserGroups(userId);
  return { ok: true, message: "Groups fetched successfully.", data: groups };
};

export const updateLastSeen = async (
  groupId: string,
  requesterId: string,
): Promise<Result> => {
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_ERROR.NOT_FOUND);

  const requesterRole = await fetchMemberRole(groupId, requesterId);
  if (!requesterRole) throw new ForbiddenError(GROUP_ERROR.NOT_A_MEMBER);

  await updateSeen(groupId, requesterId);

  return { ok: true, message: "Last seen updated." };
};

export const createGroup = async (
  groupName: string,
  userId: string,
): Promise<Result<GroupDetail>> => {
  /**
   * withTransaction owns BEGIN/COMMIT/ROLLBACK entirely.
   * Inside: return to commit, throw to rollback.
   *
   * The group creator is assigned as the initial admin to ensure
   * the group always has an owner with management privileges.
   */
  const result = await withTransaction(
    pool,
    async (client): Promise<CreateGroup> => {
      const group = await insertGroup(groupName, client);
      await insertMember(group.group_id, userId, "admin", client);
      return group;
    },
  );

  // for optimistic update on client side
  const groupDetail: GroupDetail = {
    group_id: result.group_id,
    name: groupName,
    member_count: 1,
    unread_count: 0,
    role: "admin",
    last_seen_at: new Date(),
  };

  return {
    ok: true,
    data: groupDetail,
    message: "Group created successfully.",
  };
};

export const changeGroupName = async (
  groupId: string,
  groupName: string,
  requester: string,
): Promise<Result> => {
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_ERROR.NOT_FOUND);

  const requesterRole = await fetchMemberRole(groupId, requester);
  if (!requesterRole) throw new ForbiddenError(GROUP_ERROR.NOT_A_MEMBER);
  if (requesterRole !== "admin")
    throw new ForbiddenError("Only admins can change the group name");

  await updateGroupName(groupId, groupName);

  return { ok: true, message: "Group name updated successfully." };
};

/**
 * Adds a member to a group by their display ID.
 * Any existing member can add others without requiring admin approval.
 * This avoids bottlenecks in situations where the admin is unavailable
 * and a member needs to be added urgently.
 */
export const addMember = async (
  groupId: string,
  displayId: string,
  requesterId: string,
): Promise<Result<NewMember>> => {
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_ERROR.NOT_FOUND);

  const requesterRole = await fetchMemberRole(groupId, requesterId);
  if (!requesterRole) throw new ForbiddenError(GROUP_ERROR.NOT_A_MEMBER);

  const targetUserId = await fetchUserByDisplayId(displayId);
  if (!targetUserId) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);
  let data: NewMember;
  try {
    /**
     * insertMember may throw a unique constraint violation if the user
     * is already a member of the group. We catch it here and translate
     * it into a ConflictError so the raw database error never reaches
     * the global error handler. Any other error is re-thrown as-is.
     */

    data = await insertMember(groupId, targetUserId);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "constraint" in error
    ) {
      if (error.code === "23505" && error.constraint === "group_members_pkey") {
        throw new ConflictError("User is already a member of this group.");
      }
    }
    throw error;
  }

  return { ok: true, data, message: "Member added to the group." };
};

/**
 * Removes a member from a group by their display ID.
 * Restricted to admin, kick is a privileged action that forcibly
 * removes another member, as opposed to leaving which is self-initiated.
 * Admins who want to leave the group should use the leave flow instead.
 */
export const kickMember = async (
  groupId: string,
  displayId: string,
  requesterId: string,
): Promise<Result> => {
  const { userId } = await resolveGroupAction(
    groupId,
    displayId,
    requesterId,
    "admin",
  );

  /**
   * Prevents admins from using kick as a substitute for leaving.
   * Self-removal is handled separately by the leave flow.
   */
  if (userId === requesterId)
    throw new ForbiddenError(
      "You cannot remove yourself. Use the leave option instead.",
    );

  const deleted = await deleteMember(userId, groupId);
  if (!deleted) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);

  return { ok: true, message: "You have been removed from the group." };
};

/**
 * Handles a user voluntarily leaving a group.
 *
 * Uses a transaction with FOR UPDATE to prevent race conditions
 * (e.g. two admins both checking "other admins exist" and both leaving).
 *
 * If there is only one member left, that member can leave regardless of role
 * and the group is deleted to prevent orphaned groups.
 * An admin cannot leave if they are the only admin and other members remain.
 * To leave, they must promote another member first.
 *
 * Regular members can leave without restriction.
 */
export const leaveMember = async (
  groupId: string,
  requesterId: string,
): Promise<Result> => {
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_ERROR.NOT_FOUND);

  return withTransaction(pool, async (client) => {
    /**
     * Lock the requester's row to prevent concurrent modifications
     * like other admins demoting and kicking them
     */
    const requesterRole = await fetchMemberRole(
      groupId,
      requesterId,
      client,
      true,
    );
    if (!requesterRole) throw new ForbiddenError(GROUP_ERROR.NOT_A_MEMBER);

    /**
     * Lock the entire group_members set for this group to get an accurate member count.
     * This prevents race conditions where multiple members leave at the same time
     * and the count becomes inaccurate,
     */
    const memberCount = await countMembers(groupId, client);

    // Last member: remove them regardless of their role and delete the group
    if (memberCount === 1) {
      await deleteMember(requesterId, groupId, client);
      await deleteGroup(groupId, client);
      return {
        ok: true,
        message: GROUP_SUCCESS.LEFT_GROUP,
      };
    }

    // Admin with other members: ensure at least one other admin remains
    if (requesterRole === "admin") {
      /**
       * Prevents two admins from both seeing each other as "other admins"
       * and both leaving, which would leave the group without any admins.
       */
      const otherAdminsExist = await hasOtherAdmins(
        groupId,
        requesterId,
        client,
      );
      if (!otherAdminsExist)
        throw new ConflictError(
          "Promote a member to admin before leaving this group.",
        );
    }

    // Regular members (or admins with co-admins) can leave freely
    const deleted = await deleteMember(requesterId, groupId, client);
    if (!deleted) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);

    return { ok: true, message: GROUP_SUCCESS.LEFT_GROUP };
  });
};

export const promoteMember = async (
  groupId: string,
  displayId: string,
  requesterId: string,
): Promise<Result> => {
  const { userId } = await resolveGroupAction(
    groupId,
    displayId,
    requesterId,
    "admin",
  );

  const targetRole = await fetchMemberRole(groupId, userId);
  if (!targetRole) throw new NotFoundError(GROUP_ERROR.NOT_A_MEMBER);
  if (targetRole === "admin")
    throw new ConflictError("User is already an admin.");

  const promoted = await updateRole("admin", userId, groupId);
  if (!promoted) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);

  return { ok: true, message: "Member has been promoted to admin." };
};

/**
 * Allows an admin to demote aother admin or themeselves
 *
 * Self demotion is allowed because an admin might
 * want to step back from their responsibilities.
 *
 * Admin demoting another admin is also allowed because some admins
 * might become inactive
 */
export const demoteMember = async (
  groupId: string,
  displayId: string,
  requesterId: string,
): Promise<Result> => {
  const { userId } = await resolveGroupAction(
    groupId,
    displayId,
    requesterId,
    "admin",
  );

  const targetRole = await fetchMemberRole(groupId, userId);
  if (!targetRole) throw new NotFoundError(GROUP_ERROR.NOT_A_MEMBER);
  if (targetRole === "member")
    throw new ConflictError("User is already a regular member.");

  await withTransaction(pool, async (client) => {
    // Ensure at least one admin remains after demotion.
    // Guards both self-demotion and mutual-demotion races
    // (e.g. Admin A demotes B while B demotes A simultaneously).
    const otherAdminsExist = await hasOtherAdmins(groupId, userId, client);
    if (!otherAdminsExist)
      throw new ConflictError(
        "Cannot demote. This would leave the group with no admins.",
      );

    const demoted = await updateRole("member", userId, groupId, client);
    if (!demoted) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);
  });

  return { ok: true, message: "Member has been demoted to regular member." };
};

export const deleteGroupById = async (
  groupId: string,
  requesterId: string,
): Promise<Result> => {
  const group = await fetchGroupById(groupId);
  if (!group) {
    return { ok: true, message: "Group already deleted." };
  }

  const requesterRole = await fetchMemberRole(groupId, requesterId);
  if (!requesterRole) throw new ForbiddenError(GROUP_ERROR.NOT_A_MEMBER);
  if (requesterRole !== "admin")
    throw new ForbiddenError("Only admins can delete the group");

  await deleteGroup(groupId);
  return { ok: true, message: "Group deleted successfully." };
};
