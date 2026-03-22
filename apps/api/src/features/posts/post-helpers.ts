import { fetchGroupById, fetchMemberRole } from "../../common/models.js";
import { NotFoundError, ForbiddenError } from "../../utils/error.js";
import { GROUP_NOT_FOUND, NOT_A_GROUP_MEMBER } from "../../common/constants.js";
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
