import { httpClient } from "@/shared/lib/api/http.client";
import type { ApiResponse } from "@/shared/types";
import type { PaginateThread, ThreadCursor } from "@domx/shared";

export const fetchThreads = async (
  groupId: string,
  cursor: ThreadCursor | null = null,
  limit = 20,
): Promise<PaginateThread> => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set("createdAt", cursor.createdAt);
    params.set("cursorId", cursor.id);
  }

  const res = await httpClient.get<ApiResponse<PaginateThread>>(
    `/groups/${groupId}/threads?${params}`,
  );
  return res!.data;
};
