import type { GroupRoles } from "./group-types.js";
import { fetchGroupById, fetchMemberRole } from "../../common/models.js";
import { ForbiddenError, NotFoundError } from "../../utils/error.js";
import {
  GROUP_NOT_FOUND,
  NOT_A_GROUP_MEMBER,
  USER_NOT_FOUND,
} from "../../common/constants.js";
import { fetchUserByDisplayId } from "./group-model.js";

/**
 * Shared preamble for group member actions.
 * Validates that the group exists, resolves the target displayId to a userId,
 * and optionally verifies the requester's role meets a minimum privilege.
 *
 * @param requireRole - If provided, the requester must have this exact role.
 */
export const resolveGroupAction = async (
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
