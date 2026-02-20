import type { NextFunction, Request, Response } from "express";
import { createPostForUser } from "./post-service.js";

export const postHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await createPostForUser(req.user?.userId, req.body);
    res.status(201).json({
      success: result.ok,
      message: result.ok ? result.message : result.reason,
      data: result.ok ? result.data : null,
    });
  } catch (error) {
    next(error);
  }
};
