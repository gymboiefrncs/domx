import type { Request, Response } from "express";
import { fetchProfile, removeProfile } from "./profile.services.js";
import { clearCookieOptions } from "@api/features/auth/auth-helpers/setCookies.js";

export const handleGetProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;
  const profile = await fetchProfile(userId);
  res.status(200).json({
    success: true,
    message: "Profile fetched successfnully",
    data: profile,
  });
};

export const handleDeleteProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;

  await removeProfile(userId);
  res.clearCookie("refreshToken", clearCookieOptions);
  res.clearCookie("accessToken", clearCookieOptions);

  res.status(200).json({
    success: true,
    message: "Profile deleted successfully.",
  });
};
