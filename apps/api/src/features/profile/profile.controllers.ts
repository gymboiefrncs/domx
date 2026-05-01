import type { Request, Response } from "express";
import { fetchProfile, removeProfile } from "./profile.services.js";
import { clearCookieOptions } from "@api/features/auth/auth-helpers/setCookies.js";

export const handleGetProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;
  const result = await fetchProfile(userId);
  res.status(200).json({
    success: result.ok,
    message: result.message,
    data: result.ok ? result.data : null,
  });
};

export const handleDeleteProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;

  const result = await removeProfile(userId);
  res.clearCookie("refreshToken", clearCookieOptions);
  res.clearCookie("accessToken", clearCookieOptions);

  res.status(200).json({
    success: result.ok,
    message: result.message,
  });
};
