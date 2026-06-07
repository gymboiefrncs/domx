import { httpClient } from "@/shared/lib/api/http.client";
import type { ApiResponse } from "@/shared/types";
import type { ThreadDetails } from "@domx/shared";

export const fetchThreads = async (
  groupId: string,
): Promise<ThreadDetails[]> => {
  const res = await httpClient.get<ApiResponse<ThreadDetails[]>>(
    `/groups/${groupId}/thread`,
  );
  return res!.data;
};
