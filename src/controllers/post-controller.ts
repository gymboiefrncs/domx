import type { NextFunction, Request, Response } from "express";
import { createPostService } from "../services/post-service.js";

export const postController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await createPostService(req.user?.userId, req.body);
    res.status(201).json({
      success: result.ok,
      message: result.ok ? result.message : result.reason,
      data: result.ok ? result.data : "",
    });
  } catch (error) {
    next(error);
  }
};
