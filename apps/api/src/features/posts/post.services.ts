import { POST_ERROR } from "./post.constants.js";
import type { Result } from "@api/shared/types/types.js";
import { ForbiddenError, NotFoundError } from "@api/shared/error.js";
import {
  deletePost,
  fetchAllPostsByGroupId,
  fetchPostById,
  insertPost,
  updatePost,
} from "./post.repositories.js";
import { performChecks } from "./post.helpers.js";
import type { PostDetails } from "@domx/shared";

/**
 * Fetches all posts in a group.
 * Any group member can view posts.
 */
export const getGroupPosts = async (
  groupId: string,
  requesterId: string,
): Promise<Result<PostDetails[]>> => {
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
): Promise<Result<PostDetails>> => {
  // Perform necessary checks (e.g., group existence, membership) and get requester role.
  await performChecks(groupId, requesterId);

  const data = await insertPost(title, body, requesterId, groupId);

  return {
    ok: true,
    message: "Post created successfully.",
    data,
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
  if (!post) throw new NotFoundError(POST_ERROR.NOT_FOUND);

  //  Only the post author or a group admin can edit a post.
  if (post.user_id !== requesterId && requesterRole !== "admin") {
    throw new ForbiddenError("You are not allowed to edit this post.");
  }

  await updatePost(title, body, postId, groupId);

  return {
    ok: true,
    message: "Post edited successfully.",
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
  if (!post) throw new NotFoundError(POST_ERROR.NOT_FOUND);

  // Only post author and group admin can delete a post.
  if (post.user_id !== requesterId && requesterRole !== "admin") {
    throw new ForbiddenError("You are not allowed to delete this post.");
  }

  await deletePost(postId, groupId);

  return {
    ok: true,
    message: "Post deleted successfully.",
  };
};
