import { queryOptions } from "@tanstack/react-query";
import { fetchPosts } from "./api/post.api";

export const postsQueryOptions = (groupId: string) =>
  queryOptions({
    queryKey: ["posts", groupId],
    queryFn: () => fetchPosts(groupId),
  });
