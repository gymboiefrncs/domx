import { socket } from "@/shared/lib/socket/socket.client";
import type {
  Group,
  GroupAddMemberResponse,
  GroupDeleteResponse,
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
      // join the room for the user who just got added
      socket.emit("group:join", group.group_id);
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

    const handleGroupDeleted = (data: GroupDeleteResponse) => {
      const {
        data: { groupId },
      } = data;

      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => {
        return oldGroups.filter((group) => group.group_id !== groupId);
      });
    };

    socket.on("group:summary", handleGroupSummary);
    socket.on("group:member:added", handleMemberAdded);
    socket.on("group:renamed", handleRenameGroup);
    socket.on("group:deleted", handleGroupDeleted);

    return () => {
      socket.off("group:member:added", handleMemberAdded);
      socket.off("group:summary", handleGroupSummary);
      socket.off("group:renamed", handleRenameGroup);
      socket.off("group:deleted", handleGroupDeleted);
    };
  }, [queryClient]);
};
