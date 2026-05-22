import type { User } from "@domx/shared";
import { httpClient } from "@/shared/lib/api/http.client";
import type { ApiResponse } from "@/shared/types";

export const fetchProfile = async (): Promise<User> => {
  const res = await httpClient.get<ApiResponse<User>>("/profile/me");
  return res!.data;
};

export const deleteAccount = async (): Promise<void> => {
  await httpClient.delete("/profile/delete");
};
