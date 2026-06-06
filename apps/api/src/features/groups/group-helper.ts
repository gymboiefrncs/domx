import type { GroupRole } from "@domx/shared";
import { getAccessContext } from "./group.repositories.js";
import { ForbiddenError, NotFoundError } from "@api/shared/error.js";
import { GROUP_ERROR } from "./group.constants.js";
import type { GroupAction } from "./group.types.js";

/**
 * Shared preamble for group member actions.
 * Validates that the group exists, resolves the target displayId to a userId,
 * and optionally verifies the requester's role meets a minimum privilege.
 *
 * @param requiredRole - If provided, the requester must have this exact role.
 */
export const resolveGroupAction = async (
  groupId: string,
  requesterId: string,
  targetDisplayId: string | null = null,
  requiredRole?: GroupRole,
): Promise<GroupAction> => {
  const { groupExists, requesterRole, targetUserId } = await getAccessContext({
    groupId,
    userId: requesterId,
    targetDisplayId,
  });

  const isAllowed = !requiredRole || requesterRole === requiredRole; // ✅

  if (!groupExists) throw new NotFoundError(GROUP_ERROR.NOT_FOUND);
  if (!requesterRole) throw new ForbiddenError(GROUP_ERROR.NOT_A_MEMBER);
  if (!isAllowed)
    throw new ForbiddenError("You are not allowed to perform this action.");

  return { targetUserId, requesterRole };
};
