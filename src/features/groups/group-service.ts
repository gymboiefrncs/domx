import { withTransaction } from "../../config/transaction.js";
import {
  countMembers,
  deleteGroup,
  deleteMember,
  hasOtherAdmins,
  fetchGroupById,
  fetchMemberRole,
  fetchUserByDisplayId,
  insertGroup,
  insertMember,
  updateRole,
} from "./group-model.js";
import { pool } from "../../config/db.js";
import {
  ALREADY_A_MEMBER,
  GROUP_NOT_FOUND,
  MEMBER_ADDED,
  NOT_A_GROUP_MEMBER,
  SUCCESSFULLY_CREATED_GROUP_MESSAGE,
  USER_NOT_FOUND,
} from "../../common/constants.js";
import type { Result } from "../../common/types.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/error.js";
import type { GroupRoles } from "./group-types.js";

/**
 * Shared preamble for group member actions.
 * Validates that the group exists, resolves the target displayId to a userId,
 * and optionally verifies the requester's role meets a minimum privilege.
 *
 * @param requireRole - If provided, the requester must have this exact role.
 */
const resolveGroupAction = async (
  groupId: string,
  displayId: string,
  requesterId: string,
  requireRole?: GroupRoles,
): Promise<{ userId: string; requesterRole: GroupRoles }> => {
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_NOT_FOUND);

  const requesterRole = await fetchMemberRole(groupId, requesterId);
  if (!requesterRole) throw new ForbiddenError(NOT_A_GROUP_MEMBER);
  if (requireRole && requesterRole !== requireRole)
    throw new ForbiddenError(
      `Only group ${requireRole}s can perform this action.`,
    );

  const userId = await fetchUserByDisplayId(displayId);
  if (!userId) throw new NotFoundError(USER_NOT_FOUND);

  return { userId, requesterRole };
};

export const createGroup = async (
  groupName: string,
  userId: string,
): Promise<Result> => {
  /**
   * withTransaction owns BEGIN/COMMIT/ROLLBACK entirely.
   * Inside: return to commit, throw to rollback.
   *
   * The group creator is assigned as the initial admin to ensure
   * the group always has an owner with management privileges.
   */
  const result = await withTransaction(pool, async (client) => {
    const group = await insertGroup(groupName, client);
    await insertMember(group.group_id, userId, "admin", client);
    return group.group_id;
  });

  return {
    ok: true,
    data: result,
    message: SUCCESSFULLY_CREATED_GROUP_MESSAGE,
  };
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
): Promise<Result> => {
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_NOT_FOUND);

  const requesterRole = await fetchMemberRole(groupId, requesterId);
  if (!requesterRole) throw new ForbiddenError(NOT_A_GROUP_MEMBER);

  const targetUserId = await fetchUserByDisplayId(displayId);
  if (!targetUserId) throw new NotFoundError(USER_NOT_FOUND);
  try {
    /**
     * insertMember may throw a unique constraint violation if the user
     * is already a member of the group. We catch it here and translate
     * it into a ConflictError so the raw database error never reaches
     * the global error handler. Any other error is re-thrown as-is.
     */

    await insertMember(groupId, targetUserId);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "constraint" in error
    ) {
      if (error.code === "23505" && error.constraint === "group_members_pkey") {
        throw new ConflictError(ALREADY_A_MEMBER);
      }
    }
    throw error;
  }

  return { ok: true, message: MEMBER_ADDED };
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
    throw new ForbiddenError("You cannot remove yourself from the group.");

  const deleted = await deleteMember(userId, groupId);
  if (!deleted) throw new NotFoundError(USER_NOT_FOUND);

  return { ok: true, message: "Member has been removed from the group." };
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
  displayId: string,
  requesterId: string,
): Promise<Result> => {
  const { userId } = await resolveGroupAction(groupId, displayId, requesterId);

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
    if (!requesterRole) throw new ForbiddenError(NOT_A_GROUP_MEMBER);

    /**
     * Lock the entire group_members set for this group to get an accurate member count.
     * This revent race conditions where multiple members leave at the same time
     * and the count becomes inaccurate,
     */
    const memberCount = await countMembers(groupId, client);

    // Last member: remove them regardless of their role and delete the group
    if (memberCount === 1) {
      await deleteMember(userId, groupId, client);
      await deleteGroup(groupId, client);
      return {
        ok: true as const,
        message: "You have left the group",
      };
    }

    // Admin with other members: ensure at least one other admin remains
    if (requesterRole === "admin") {
      /**
       * Prevents two admins from both seeing each other as "other admins"
       * and both leaving, which would leave the group without any admins.
       */
      const otherAdminsExist = await hasOtherAdmins(groupId, userId, client);
      if (!otherAdminsExist)
        throw new ConflictError(
          "Promote a member to admin before leaving this group.",
        );
    }

    // Regular members (or admins with co-admins) can leave freely
    const deleted = await deleteMember(userId, groupId, client);
    if (!deleted) throw new NotFoundError(USER_NOT_FOUND);

    return { ok: true as const, message: "You have left the group." };
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
  if (!targetRole) throw new NotFoundError(NOT_A_GROUP_MEMBER);
  if (targetRole === "admin")
    throw new ConflictError("User is already an admin.");

  const promoted = await updateRole("admin", userId, groupId);
  if (!promoted) throw new NotFoundError(USER_NOT_FOUND);

  return { ok: true, message: "Member has been promoted" };
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
  if (!targetRole) throw new NotFoundError(NOT_A_GROUP_MEMBER);
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
    if (!demoted) throw new NotFoundError(USER_NOT_FOUND);
  });

  return { ok: true, message: "Member has been demoted" };
};
