import {
  CANNOT_DELETE_POST,
  CANNOT_EDIT_POST,
  POST_CREATED,
  POST_DELETED,
  POST_EDITED,
  POST_NOT_FOUND,
} from "../../common/constants.js";
import type { Result } from "../../common/types.js";
import { ForbiddenError, NotFoundError } from "../../utils/error.js";
import {
  deletePost,
  fetchAllPostsByGroupId,
  fetchPostById,
  insertPost,
  updatePost,
} from "./post-model.js";
import { performChecks } from "./post-helpers.js";

/**
 * Fetches all posts in a group.
 * Any group member can view posts.
 */
export const getGroupPosts = async (
  groupId: string,
  requesterId: string,
): Promise<Result> => {
  await performChecks(groupId, requesterId);

  const posts = await fetchAllPostsByGroupId(groupId);
  return { ok: true, message: "Posts fetched successfully.", data: posts };
};

/**
 * Creates a new post in a group.
 * Any group member can create a post.
 * Validates that the group exists and the requester is a member.
 */
export const createPost = async (
  title: string,
  body: string,
  requesterId: string,
  groupId: string,
): Promise<Result> => {
  // Perform necessary checks (e.g., group existence, membership) and get requester role.
  await performChecks(groupId, requesterId);

  await insertPost(title, body, requesterId, groupId);

  return {
    ok: true,
    message: POST_CREATED,
  };
};

export const editPost = async (
  title: string,
  body: string,
  requesterId: string,
  groupId: string,
  postId: string,
): Promise<Result> => {
  // Perform necessary checks (e.g., group existence, membership) and get requester role.
  const requesterRole = await performChecks(groupId, requesterId);

  const post = await fetchPostById(postId, groupId);
  if (!post) throw new NotFoundError(POST_NOT_FOUND);

  //  Only the post author or a group admin can edit a post.
  if (post.user_id !== requesterId && requesterRole !== "admin") {
    throw new ForbiddenError(CANNOT_EDIT_POST);
  }

  await updatePost(title, body, postId, groupId);

  return {
    ok: true,
    message: POST_EDITED,
  };
};

export const removePost = async (
  postId: string,
  groupId: string,
  requesterId: string,
): Promise<Result> => {
  // Perform necessary checks (e.g., group existence, membership) and get requester role.
  const requesterRole = await performChecks(groupId, requesterId);

  const post = await fetchPostById(postId, groupId);
  if (!post) throw new NotFoundError(POST_NOT_FOUND);

  // Only post author and group admin can delete a post.
  if (post.user_id !== requesterId && requesterRole !== "admin") {
    throw new ForbiddenError(CANNOT_DELETE_POST);
  }

  await deletePost(postId, groupId);

  return {
    ok: true,
    message: POST_DELETED,
  };
};
