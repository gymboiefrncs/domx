import type { RequestHandler } from "express";
import { getGroupPosts } from "../post.services.js";
import type { PostParams, PostResponse } from "../post.types.js";
import type { PostDetails } from "@domx/shared";

export const handleGetPosts: RequestHandler<
  PostParams,
  PostResponse<PostDetails[]>
> = async (req, res): Promise<void> => {
  const { groupId } = req.params;
  const requesterId = req.user!.userId;

  const posts = await getGroupPosts(groupId, requesterId);
  res.status(200).json({
    data: posts,
  });
};
