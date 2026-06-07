import { POST_ERROR } from "./thread.constants.js";
import { NotFoundError } from "@api/shared/error.js";
import {
  deleteThread,
  getAllThreads,
  insertThread,
  updateThread,
} from "./thread.repositories.js";
import { performChecks } from "./thread.helpers.js";
import type { ThreadDetails } from "@domx/shared";
import type {
  CreateThreadParams,
  GroupRequestContext,
  ThreadRequestContext,
  UpdateThreadParams,
} from "./thread.types.js";

/**
 * Fetches all posts in a group.
 * Any group member can view posts.
 */
export const getGroupThreads = async ({
  groupId,
  requesterId,
}: GroupRequestContext): Promise<ThreadDetails[]> => {
  await performChecks(groupId, requesterId);
  return getAllThreads(groupId);
};

/**
 * Creates a new post in a group.
 * Any group member can create a post.
 * Validates that the group exists and the requester is a member.
 */
export const createThread = async ({
  title,
  content,
  requesterId,
  groupId,
}: CreateThreadParams): Promise<ThreadDetails> => {
  // Perform necessary checks (e.g., group existence, membership) and get requester role.
  await performChecks(groupId, requesterId);
  return insertThread({ title, content, userId: requesterId, groupId });
};

export const editThread = async ({
  groupId,
  requesterId,
  threadId,
  title,
  content,
}: UpdateThreadParams): Promise<ThreadDetails> => {
  // Perform necessary checks (e.g., group existence, membership) and get requester role.
  await performChecks(groupId, requesterId);

  const updatedThread = await updateThread({
    threadId,
    groupId,
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
  });
  if (!updatedThread) throw new NotFoundError(POST_ERROR.NOT_FOUND);
  return updatedThread;
};

export const removeThread = async ({
  groupId,
  requesterId,
  threadId,
}: ThreadRequestContext): Promise<ThreadDetails> => {
  // Perform necessary checks (e.g., group existence, membership) and get requester role.
  await performChecks(groupId, requesterId);

  const deletedThread = await deleteThread({ threadId, groupId });
  if (!deletedThread) throw new NotFoundError(POST_ERROR.NOT_FOUND);
  return deletedThread;
};
