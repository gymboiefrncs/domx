import {
  findGroupsByUserId,
  getMemberRole,
} from "@api/features/groups/index.js";
import { NotFoundError, ForbiddenError } from "@api/shared/error.js";
import { GROUP_ERROR } from "@api/features/groups/index.js";
import { findThreadById } from "./thread.repositories.js";

export const performChecks = async (
  groupId: string,
  requesterId: string,
  threadId?: string,
): Promise<void> => {
  const group = await findGroupsByUserId(requesterId);
  if (!group) throw new NotFoundError(GROUP_ERROR.NOT_FOUND);

  const requesterRole = await getMemberRole({ groupId, userId: requesterId });
  if (!requesterRole) throw new ForbiddenError(GROUP_ERROR.NOT_A_MEMBER);

  if (threadId) {
    const thread = await findThreadById({ threadId, groupId });
    if (!thread) throw new NotFoundError("Thread not found.");
    if (thread.user_id !== requesterId && requesterRole !== "admin") {
      throw new ForbiddenError(
        "You do not have permission to modify this thread.",
      );
    }
  }
};
