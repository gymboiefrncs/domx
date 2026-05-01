import { NotFoundError } from "@api/shared/error.js";
import { deleteProfileAccount, getProfile } from "./profile.repositories.js";
import type { User } from "@domx/shared";
import { PROFILE_ERROR } from "./profile.constants.js";

export const fetchProfile = async (userId: string): Promise<User> => {
  const profile = await getProfile(userId);

  if (!profile) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);

  return profile;
};

export const removeProfile = async (userId: string): Promise<void> => {
  const deleted = await deleteProfileAccount(userId);
  if (!deleted) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);
};
