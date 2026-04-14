import { fetchWithAuth } from "@/shared/lib/fetchWithAuth";
import { API_BASE_URL } from "@/shared/config";
import type { PostDetails } from "@domx/shared";
import { getApiErrorMessage } from "@/shared/lib/errors";

export const fetchMessages = async (
  groupId: string,
): Promise<PostDetails[]> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/posts`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));

  return data.data;
};
