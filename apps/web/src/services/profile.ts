import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { User } from "@domx/shared";
import { API_BASE_URL } from "@/config";
import { getApiErrorMessage } from "@/utils/error";

export const fetchProfile = async (): Promise<User> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/profile/me`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data.data;
};

export const deleteAccount = async () => {
  const res = await fetchWithAuth(`${API_BASE_URL}/profile/me`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data;
};
