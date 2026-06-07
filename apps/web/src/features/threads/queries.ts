import { queryOptions } from "@tanstack/react-query";
import { fetchThreads } from "./api/thread.api";

export const threadsQueryOptions = (groupId: string) =>
  queryOptions({
    queryKey: ["threads", groupId] as const,
    queryFn: () => fetchThreads(groupId),
  });
