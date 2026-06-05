import { createGroup } from "../api/group.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import type { Group } from "@domx/shared";
import { socket } from "@/shared/lib/socket/socket.client";

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
