import type { Request, Response } from "express";
import { getGroupPosts } from "../post.services.js";

export const handleGetPosts = async (
  req: Request<{ groupId: string }>,
  res: Response,
): Promise<void> => {
  const { groupId } = req.params;
  const requesterId = req.user!.userId;

  const result = await getGroupPosts(groupId, requesterId);
  res.status(200).json({
    success: result.ok,
    message: result.message,
    data: result.ok ? result.data : null,
  });
};
