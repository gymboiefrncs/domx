import type { Request, Response, NextFunction } from "express";
import { createGroup } from "./group-service.js";

export const handleCreateGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const result = await createGroup(req.body.groupName, userId);
    res.status(201).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
