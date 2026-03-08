import {
  GROUP_NOT_FOUND,
  NOT_A_GROUP_MEMBER,
  POST_CREATED,
} from "../../common/constants.js";
import type { Result } from "../../common/types.js";
import { ForbiddenError, NotFoundError } from "../../utils/error.js";
import { fetchGroupById, fetchMemberRole } from "../../common/models.js";
import { insertPost } from "./post-model.js";

/**
 * Creates a new post in a group.
 * Any group member can create a post
 * Validates that the group exists and the requester is a member.
 */
export const createPost = async (
  body: string,
  requesterId: string,
  groupId: string,
): Promise<Result> => {
  const group = await fetchGroupById(groupId);
  if (!group) throw new NotFoundError(GROUP_NOT_FOUND);

  const requesterRole = await fetchMemberRole(groupId, requesterId);
  if (!requesterRole) throw new ForbiddenError(NOT_A_GROUP_MEMBER);

  await insertPost(body, requesterId, groupId);

  return {
    ok: true,
    message: POST_CREATED,
  };
};
