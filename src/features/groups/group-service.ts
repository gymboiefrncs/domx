import { withTransaction } from "../../config/transaction.js";
import {
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
  if (!targetUserId)
    throw new NotFoundError(
      "User with the provided display ID does not exist.",
    );
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
      if (
        error.code === "23505" &&
        error.constraint === "members_group_id_user_id_key"
      ) {
        throw new ConflictError(ALREADY_A_MEMBER);
      }
    }
    throw error;
  }

  return { ok: true, message: MEMBER_ADDED };
};
