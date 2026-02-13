import type { Result } from "../common/types.js";
import { profileModel } from "../models/profile-model.js";
import { NotFoundError, UnauthorizedError } from "../utils/error.js";

export const profileService = async (
  userId: string | undefined,
): Promise<Result> => {
  if (!userId) throw new UnauthorizedError("User not authenticated");
  const profile = await profileModel(userId);
  if (!profile) throw new NotFoundError("Profile not found");
  return { ok: true, message: "Profile retrieved successfully", data: profile };
};
