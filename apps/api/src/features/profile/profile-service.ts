import { NotFoundError } from "@api/utils/error.js";
import { getProfile } from "./profile-model.js";

export const fetchProfile = async (userId: string) => {
  const profile = await getProfile(userId);

  if (!profile) throw new NotFoundError("Profile not found.");

  return { ok: true, message: "Profile fetched successfully.", data: profile };
};
