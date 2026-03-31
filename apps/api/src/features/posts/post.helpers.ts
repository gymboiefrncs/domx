import { fetchGroupById, fetchMemberRole } from "@api/features/groups/index.js";
import { NotFoundError, ForbiddenError } from "@api/utils/error.js";
import {
  GROUP_NOT_FOUND,
  NOT_A_GROUP_MEMBER,
} from "@api/features/groups/index.js";
import type { GroupRole } from "@domx/shared";

export const performChecks = async (
  groupId: string,
  requesterId: string,
): Promise<GroupRole> => {
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_NOT_FOUND);

  const requesterRole = await fetchMemberRole(groupId, requesterId);
  if (!requesterRole) throw new ForbiddenError(NOT_A_GROUP_MEMBER);
  return requesterRole;
};
