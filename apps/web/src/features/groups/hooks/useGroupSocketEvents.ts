import { socket } from "@/shared/lib/socket/socket.client";
import type {
  Group,
  GroupAddMemberResponse,
  GroupDeleteResponse,
  GroupLeftResponse,
  GroupMemberKickResponse,
  GroupMemberResponse,
  GroupRenameResponse,
  GroupSeenResponse,
  GroupSummaryResponse,
  Member,
  User,
} from "@domx/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

export const useGroupSocketEvents = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const errorCallback = ({ message }: { message: string }) => {
      toast.error(message);
    };

    const handleMemberAdded = (payload: GroupAddMemberResponse) => {
      const { groupId, groupDetail } = payload.data;

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

    const handleGroupSummary = (payload: GroupSummaryResponse) => {
      const { group } = payload;
      // join the room for the user who just got added
      socket.emit("group:join", group.group_id);
      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => [
        ...oldGroups,
        group,
      ]);
    };

    const handleRenameGroup = (payload: GroupRenameResponse) => {
      const {
        data: { groupId, newName },
      } = payload;
      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => {
        return oldGroups.map((group) =>
          group.group_id === groupId ? { ...group, name: newName } : group,
        );
      });
    };

    const handleGroupDeleted = (payload: GroupDeleteResponse) => {
      const {
        data: { groupId },
      } = payload;

      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => {
        return oldGroups.filter((group) => group.group_id !== groupId);
      });
    };

    const handleMemberLeave = (payload: GroupLeftResponse) => {
      const {
        data: { groupId, memberCount, wasDeleted },
        by,
      } = payload;
      const me = queryClient.getQueryData<User>(["profile", "me"]);

      const isActor = me?.id === by;

      queryClient.invalidateQueries({
        queryKey: ["groups", groupId, "members"],
      });

      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => {
        return oldGroups.map((group) =>
          group.group_id === groupId
            ? { ...group, member_count: memberCount }
            : group,
        );
      });

      // for group list to be updated
      if (wasDeleted || isActor) {
        queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => {
          return oldGroups.filter((group) => group.group_id !== groupId);
        });
      }
    };

    const handleKick = (payload: GroupMemberKickResponse) => {
      const { groupId, memberCount, targetId } = payload.data;
      const me = queryClient.getQueryData<User>(["profile", "me"]);
      const isTarget = me?.id === targetId;

      queryClient.invalidateQueries({
        queryKey: ["groups", groupId, "members"],
      });

      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => {
        return oldGroups.map((group) =>
          group.group_id === groupId
            ? { ...group, member_count: memberCount }
            : group,
        );
      });
      if (isTarget) {
        queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) => {
          return oldGroups.filter((group) => group.group_id !== groupId);
        });
      }
    };

    const handlePromoteMember = (payload: GroupMemberResponse) => {
      const { groupId } = payload.data;
      queryClient.invalidateQueries({
        queryKey: ["groups", groupId, "members"],
      });
    };

    const handleDemoteMember = (payload: GroupMemberResponse) => {
      const { groupId } = payload.data;
      queryClient.invalidateQueries({
        queryKey: ["groups", groupId, "members"],
      });
    };

    const handleGroupSeenAck = (payload: GroupSeenResponse) => {
      const { groupId, userId, seenAt } = payload.data;
      const me = queryClient.getQueryData<User>(["profile", "me"]);

      queryClient.setQueryData(
        ["groups", groupId, "members"],
        (oldMembers: Member[] = []) => {
          return oldMembers.map((member) =>
            member.id === userId ? { ...member, last_seen_at: seenAt } : member,
          );
        },
      );

      if (userId === me?.id) {
        queryClient.setQueryData(["groups"], (oldGroups: Group[]) => {
          return oldGroups.map((group) =>
            group.group_id === groupId ? { ...group, unread_count: 0 } : group,
          );
        });
      }
    };

    socket.on("group:summary", handleGroupSummary);
    socket.on("group:member:added", handleMemberAdded);
    socket.on("group:renamed", handleRenameGroup);
    socket.on("group:deleted", handleGroupDeleted);
    socket.on("group:member:left", handleMemberLeave);
    socket.on("group:member:kicked", handleKick);
    socket.on("group:member:promoted", handlePromoteMember);
    socket.on("group:member:demoted", handleDemoteMember);
    socket.on("group:seen:ack", handleGroupSeenAck);

    // error events
    socket.on("group:rename:failed", errorCallback);
    socket.on("group:delete:failed", errorCallback);
    socket.on("group:member:add:failed", errorCallback);
    socket.on("group:member:leave:failed", errorCallback);
    socket.on("group:member:kick:failed", errorCallback);
    socket.on("group:member:promote:failed", errorCallback);
    socket.on("group:member:demote:failed", errorCallback);

    return () => {
      socket.off("group:member:added", handleMemberAdded);
      socket.off("group:summary", handleGroupSummary);
      socket.off("group:renamed", handleRenameGroup);
      socket.off("group:deleted", handleGroupDeleted);
      socket.off("group:member:left", handleMemberLeave);
      socket.off("group:member:kicked", handleKick);
      socket.off("group:member:promoted", handlePromoteMember);
      socket.off("group:member:demoted", handleDemoteMember);
      socket.off("group:seen:ack", handleGroupSeenAck);

      // error events
      socket.off("group:rename:failed", errorCallback);
      socket.off("group:delete:failed", errorCallback);
      socket.off("group:member:add:failed", errorCallback);
      socket.off("group:member:leave:failed", errorCallback);
      socket.off("group:member:kick:failed", errorCallback);
      socket.off("group:member:promote:failed", errorCallback);
      socket.off("group:member:demote:failed", errorCallback);
    };
  }, [queryClient]);
};
