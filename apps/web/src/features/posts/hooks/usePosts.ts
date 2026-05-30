import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchPosts } from "../api/post.api";

export const postsQueryOptions = (groupId: string) =>
  queryOptions({
    queryKey: ["posts", groupId],
    queryFn: () => fetchPosts(groupId),
  });

export const usePosts = (groupId: string) =>
  useQuery(postsQueryOptions(groupId));
