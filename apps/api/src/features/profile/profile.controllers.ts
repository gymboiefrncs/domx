import type { RequestHandler } from "express";
import { fetchProfile, removeProfile } from "./profile.services.js";
import { clearCookieOptions } from "@api/features/auth/auth-helpers/setCookies.js";
import type { User } from "@domx/shared";

export const handleGetProfile: RequestHandler<
  Record<string, never>,
  { data: User }
> = async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const profile = await fetchProfile(userId);
  res.status(200).json({
    data: profile,
  });
};

export const handleDeleteProfile: RequestHandler<
  Record<string, never>,
  never
> = async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  await removeProfile(userId);
  res.clearCookie("refreshToken", clearCookieOptions);
  res.clearCookie("accessToken", clearCookieOptions);

  res.status(204).send();
};
