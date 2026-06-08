import type { RequestHandler } from "express";
import { getGroupThreads } from "../thread.services.js";
import type { ThreadParams, ThreadResponse } from "../thread.types.js";
import type { PaginateThread } from "@domx/shared";

export const handleGetGroupThreads: RequestHandler<
  ThreadParams,
  ThreadResponse<PaginateThread>
> = async (req, res) => {
  const { groupId } = req.params;
  const requesterId = req.user!.userId;
  const cursorId = req.query.cursorId as string | undefined;
  const createdAt = req.query.createdAt as string | undefined;
  const cursor = cursorId && createdAt ? { id: cursorId, createdAt } : null;
  const limit = Number(req.query.limit) || 20;

  const posts = await getGroupThreads({ groupId, requesterId, cursor, limit });
  res.status(200).json({
    data: posts,
  });
};
