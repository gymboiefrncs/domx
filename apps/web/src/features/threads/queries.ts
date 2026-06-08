import { infiniteQueryOptions } from "@tanstack/react-query";
import { fetchThreads } from "./api/thread.api";
import type { ThreadCursor } from "@domx/shared";

export const threadsQueryOptions = (groupId: string) =>
  infiniteQueryOptions({
    queryKey: ["threads", groupId] as const,
    queryFn: ({ pageParam }) => fetchThreads(groupId, pageParam),
    initialPageParam: null as ThreadCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
  });
