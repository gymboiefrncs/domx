import { socket } from "@/shared/lib/socket/socket.client";
import type {
  Group,
  GroupAddMemberResponse,
  GroupRenameResponse,
  GroupSummaryResponse,
} from "@domx/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const useGroupSocketEvents = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const handleMemberAdded = (data: GroupAddMemberResponse) => {
      const { groupId, groupDetail } = data.data;

      queryClient.invalidateQueries({
        queryKey: ["groups", groupId, "members"],
      });

      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => {
        return oldGroups.map((group) =>
          group.group_id === groupId
            ? {
                ...group,
                member_count: groupDetail.member_count,
              }
            : group,
        );
      });
    };
    const handleGroupSummary = (data: GroupSummaryResponse) => {
      const { group } = data;
      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => [
        ...oldGroups,
        group,
      ]);
    };

    const handleRenameGroup = (data: GroupRenameResponse) => {
      console.log(data.data.newName);
      const {
        data: { groupId, newName },
      } = data;
      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => {
        return oldGroups.map((group) =>
          group.group_id === groupId ? { ...group, name: newName } : group,
        );
      });
    };

    socket.on("group:summary", handleGroupSummary);
    socket.on("group:member:added", handleMemberAdded);
    socket.on("group:renamed", handleRenameGroup);
    return () => {
      socket.off("group:member:added", handleMemberAdded);
      socket.off("group:summary", handleGroupSummary);
      socket.off("group:renamed", handleRenameGroup);
    };
  }, [queryClient]);
};
