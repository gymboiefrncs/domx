import { fetchGroupById, fetchMemberRole } from "@api/features/groups/index.js";
import { NotFoundError, ForbiddenError } from "@api/shared/error.js";
import { GROUP_ERROR } from "@api/features/groups/index.js";
import type { GroupRole } from "@domx/shared";

export const performChecks = async (
  groupId: string,
  requesterId: string,
): Promise<GroupRole> => {
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_ERROR.NOT_FOUND);

  const requesterRole = await fetchMemberRole(groupId, requesterId);
  if (!requesterRole) throw new ForbiddenError(GROUP_ERROR.NOT_A_MEMBER);
  return requesterRole;
};
