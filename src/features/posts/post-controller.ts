import type { Request, Response, NextFunction } from "express";
import { createPost } from "./post-service.js";

export const handleCreatePost = async (
  req: Request<{ groupId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { groupId } = req.params;
    const requesterId = req.user!.userId;
    const { body } = req.body;

    const result = await createPost(body, requesterId, groupId);
    res.status(201).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
