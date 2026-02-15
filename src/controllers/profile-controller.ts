import type { NextFunction, Request, Response } from "express";
import { profileService } from "../services/profile-service.js";

export const profileController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await profileService(req.user?.userId);
    res.status(200).json({
      success: result.ok,
      message: result.ok ? result.message : result.reason,
      data: result.ok ? result.data : null,
    });
  } catch (error) {
    next(error);
  }
};
