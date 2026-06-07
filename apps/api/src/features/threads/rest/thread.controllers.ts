import type { RequestHandler } from "express";
import { getGroupThreads } from "../thread.services.js";
import type { ThreadParams, ThreadResponse } from "../thread.types.js";
import type { ThreadDetails } from "@domx/shared";

export const handleGetGroupThreads: RequestHandler<
  ThreadParams,
  ThreadResponse<ThreadDetails[]>
> = async (req, res) => {
  const { groupId } = req.params;
  const requesterId = req.user!.userId;

  const posts = await getGroupThreads({ groupId, requesterId });
  res.status(200).json({
    data: posts,
  });
};
