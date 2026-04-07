import { NotFoundError } from "@api/shared/error.js";
import { deleteProfileAccount, getProfile } from "./profile.repositories.js";
import type { Result } from "@api/shared/types/types.js";
import type { User } from "@domx/shared";
import { PROFILE_ERROR } from "./profile.constants.js";

export const fetchProfile = async (userId: string): Promise<Result<User>> => {
  const profile = await getProfile(userId);

  if (!profile) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);

  return { ok: true, message: "Profile fetched successfully.", data: profile };
};

export const removeProfile = async (userId: string): Promise<Result> => {
  const deleted = await deleteProfileAccount(userId);
  if (!deleted) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);

  return { ok: true, message: "Account deleted successfully." };
};
