import type { GroupRole } from "@domx/shared";
import { fetchGroupById, fetchMemberRole } from "./group.repositories.js";
import { ForbiddenError, NotFoundError } from "@api/shared/error.js";
import { GROUP_ERROR } from "./group.constants.js";
import { PROFILE_ERROR } from "@api/features/profile/index.js";
import { fetchUserByDisplayId } from "./group.repositories.js";
import type { ChatSocket } from "../posts/index.js";

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
  requireRole?: GroupRole,
): Promise<{ userId: string; requesterRole: GroupRole }> => {
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_ERROR.NOT_FOUND);

  const requesterRole = await fetchMemberRole(groupId, requesterId);
  if (!requesterRole) throw new ForbiddenError(GROUP_ERROR.NOT_A_MEMBER);
  if (requireRole && requesterRole !== requireRole)
    throw new ForbiddenError(
      `Only group ${requireRole}s can perform this action.`,
    );

  const userId = await fetchUserByDisplayId(displayId);
  if (!userId) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);

  return { userId, requesterRole };
};

export const broadcastToGroup = (
  rooms: Map<string, Set<ChatSocket>>,
  groupId: string,
  payload: string,
): void => {
  const room = rooms.get(groupId);
  room?.forEach((client) => {
    client.send(payload);
  });
};
