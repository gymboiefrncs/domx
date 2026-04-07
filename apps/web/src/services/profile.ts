import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { User } from "@domx/shared";

export const fetchProfile = async (): Promise<User> => {
  const res = await fetchWithAuth(`http://localhost:8080/api/v1/profile/me`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);
  return data.data;
};

export const deleteAccount = async () => {
  const res = await fetchWithAuth(`http://localhost:8080/api/v1/profile/me`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);
  return data;
};
