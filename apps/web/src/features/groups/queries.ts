import { queryOptions } from "@tanstack/react-query";
import { fetchGroupMembers, fetchGroups } from "./api/group.api";

export const groupsQueryOptions = queryOptions({
  queryKey: ["groups"] as const,
  queryFn: fetchGroups,
});

export const groupMembersQueryOptions = (groupId: string) =>
  queryOptions({
    queryKey: ["groups", groupId, "members"] as const,
    queryFn: () => fetchGroupMembers(groupId),
  });
