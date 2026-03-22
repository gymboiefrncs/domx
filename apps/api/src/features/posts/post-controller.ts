import type { Request, Response, NextFunction } from "express";
import {
  createPost,
  editPost,
  getGroupPosts,
  removePost,
} from "./post-service.js";
import type { PostParams } from "./post-types.js";

export const handleGetPosts = async (
  req: Request<{ groupId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const requesterId = req.user!.userId;

    const result = await getGroupPosts(groupId, requesterId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
      data: result.ok ? result.data : null,
    });
  } catch (error) {
    next(error);
  }
};

export const handleCreatePost = async (
  req: Request<{ groupId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const requesterId = req.user!.userId;
    const { body, title } = req.body;

    const result = await createPost(title, body, requesterId, groupId);
    res.status(201).json({
      success: result.ok,
      message: result.message,
      data: result.ok ? result.data : null,
    });
  } catch (error) {
    next(error);
  }
};

export const handleEditPost = async (
  req: Request<PostParams>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { groupId, postId } = req.params;
    const requesterId = req.user!.userId;
    const { body, title } = req.body;

    const result = await editPost(title, body, requesterId, groupId, postId);
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
): Promise<void> => {
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
