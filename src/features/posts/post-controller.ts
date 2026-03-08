import type { Request, Response, NextFunction } from "express";
import { createPost, editPost, removePost } from "./post-service.js";
import type { PostParams } from "./post-types.js";

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

export const handleEditPost = async (
  req: Request<PostParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { groupId, postId } = req.params;
    const requesterId = req.user!.userId;
    const { body } = req.body;

    const result = await editPost(body, requesterId, groupId, postId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const handleDeletePost = async (
  req: Request<PostParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { groupId, postId } = req.params;
    const requesterId = req.user!.userId;

    const result = await removePost(postId, groupId, requesterId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
