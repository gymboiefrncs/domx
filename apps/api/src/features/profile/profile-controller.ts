import type { Request, Response, NextFunction } from "express";
import { fetchProfile } from "./profile-service.js";

export const handleGetProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const result = await fetchProfile(userId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
      data: result.ok ? result.data : null,
    });
  } catch (error) {
    next(error);
  }
};
