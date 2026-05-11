import type { PostDetails } from "@domx/shared";
import { httpClient } from "@/shared/lib/api/http.client";
import type { ApiResponse } from "@/shared/types";

export const fetchMessages = async (
  groupId: string,
): Promise<PostDetails[]> => {
  const res = await httpClient.get<ApiResponse<PostDetails[]>>(
    `/groups/${groupId}/posts`,
  );
  return res!.data;
};
