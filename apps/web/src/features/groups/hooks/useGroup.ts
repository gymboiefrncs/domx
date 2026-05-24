import { createGroup, fetchGroupMembers, fetchGroups } from "../api/group.api";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import type { Group } from "@domx/shared";
import { socket } from "@/shared/lib/socket/socket.client";

export const groupsQueryOptions = queryOptions({
  queryKey: ["groups"],
  queryFn: fetchGroups,
});

export const useGroups = () => useQuery(groupsQueryOptions);

export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: (newGroup: Group) => {
      socket.emit("group:join", newGroup.group_id);
      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => {
        return [...oldGroups, newGroup];
      });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useGroupMembers = (groupId: string) =>
  useQuery({
    queryKey: ["groups", groupId, "members"],
    queryFn: () => fetchGroupMembers(groupId),
  });
