import { withTransaction } from "../../config/transaction.js";
import {
  deleteMember,
  fetchGroupById,
  fetchMemberRole,
  fetchUserByDisplayId,
  insertGroup,
  insertMember,
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
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_NOT_FOUND);

  const requesterRole = await fetchMemberRole(groupId, requesterId);
  if (!requesterRole) throw new ForbiddenError(NOT_A_GROUP_MEMBER);
  if (requesterRole !== "admin")
    throw new ForbiddenError("Only group admins can kick members.");

  const userId = await fetchUserByDisplayId(displayId);
  if (!userId) throw new NotFoundError(USER_NOT_FOUND);

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
