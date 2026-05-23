import { createGroup, fetchGroups } from "../api/group.api";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useModalStore } from "../store/group.modal";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import type { Group } from "@domx/shared";

export const groupsQueryOptions = queryOptions({
  queryKey: ["groups"],
  queryFn: fetchGroups,
});

export const useGroups = () => useQuery(groupsQueryOptions);

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const closeModal = useModalStore((state) => state.closeModal);

  return useMutation({
    mutationFn: createGroup,
    onSuccess: (newGroup: Group) => {
      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => {
        return [...oldGroups, newGroup];
      });
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};
