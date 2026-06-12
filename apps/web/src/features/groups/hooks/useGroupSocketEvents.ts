import { socket } from "@/shared/lib/socket/socket.client";
import type {
  GroupAddMemberResponse,
  GroupDeleteResponse,
  GroupLeftResponse,
  GroupMemberKickResponse,
  GroupMemberResponse,
  GroupRenameResponse,
  GroupSeenResponse,
  GroupSummaryResponse,
} from "@domx/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { groupMembersQueryOptions, groupsQueryOptions } from "../queries";
import { meQueryOptions } from "@/features/profile/queries";

export const useGroupSocketEvents = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const errorCallback = ({ message }: { message: string }) => {
      toast.error(message);
    };

    const handleMemberAdded = (payload: GroupAddMemberResponse) => {
      const { groupId, groupDetail } = payload.data;

      queryClient.invalidateQueries({
        queryKey: groupMembersQueryOptions(groupId).queryKey,
      });

      queryClient.setQueryData(groupsQueryOptions.queryKey, (oldGroups) => {
        return oldGroups?.map((group) =>
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
      queryClient.setQueryData(groupsQueryOptions.queryKey, (oldGroups) =>
        oldGroups ? [...oldGroups, group] : [group],
      );
    };

    const handleRenameGroup = (payload: GroupRenameResponse) => {
      const {
        data: { groupId, newName },
      } = payload;
      queryClient.setQueryData(groupsQueryOptions.queryKey, (oldGroups) => {
        return oldGroups?.map((group) =>
          group.group_id === groupId ? { ...group, name: newName } : group,
        );
      });
    };

    const handleGroupDeleted = (payload: GroupDeleteResponse) => {
      const {
        data: { groupId },
      } = payload;

      queryClient.setQueryData(groupsQueryOptions.queryKey, (oldGroups) => {
        return oldGroups?.filter((group) => group.group_id !== groupId);
      });
    };

    const handleMemberLeave = (payload: GroupLeftResponse) => {
      const {
        data: { groupId, memberCount, wasDeleted },
        by,
      } = payload;
      const me = queryClient.getQueryData(meQueryOptions.queryKey);

      const isActor = me?.id === by;

      queryClient.setQueryData(
        groupMembersQueryOptions(groupId).queryKey,
        (oldMembers) => {
          if (!oldMembers) return oldMembers;
          return oldMembers.filter((member) => member.id !== by);
        },
      );

      queryClient.setQueryData(groupsQueryOptions.queryKey, (oldGroups) => {
        if (!oldGroups) return undefined;
        // for group list to be updated
        if (wasDeleted || isActor)
          return oldGroups.filter((group) => group.group_id !== groupId);

        return oldGroups.map((group) =>
          group.group_id === groupId
            ? { ...group, member_count: memberCount }
            : group,
        );
      });
    };

    const handleKick = (payload: GroupMemberKickResponse) => {
      const { groupId, memberCount, targetId } = payload.data;
      const me = queryClient.getQueryData(meQueryOptions.queryKey);
      const isTarget = me?.id === targetId;

      queryClient.setQueryData(
        groupMembersQueryOptions(groupId).queryKey,
        (oldMembers) => {
          if (!oldMembers) return oldMembers;
          return oldMembers.filter((member) => member.display_id !== targetId);
        },
      );

      queryClient.setQueryData(groupsQueryOptions.queryKey, (oldGroups) => {
        if (!oldGroups) return undefined;
        if (isTarget)
          return oldGroups.filter((group) => group.group_id !== groupId);

        return oldGroups.map((group) =>
          group.group_id === groupId
            ? { ...group, member_count: memberCount }
            : group,
        );
      });
    };

    const handlePromoteMember = (payload: GroupMemberResponse) => {
      const { groupId, newRole, targetUserDisplayId } = payload.data;
      const me = queryClient.getQueryData(meQueryOptions.queryKey);
      const isTarget = me?.display_id === targetUserDisplayId;

      queryClient.setQueryData(
        groupMembersQueryOptions(groupId).queryKey,
        (oldMembers) => {
          if (!oldMembers) return oldMembers;
          return oldMembers.map((member) =>
            member.display_id === targetUserDisplayId
              ? { ...member, role: newRole }
              : member,
          );
        },
      );

      if (isTarget) {
        queryClient.setQueryData(groupsQueryOptions.queryKey, (oldGroups) => {
          return oldGroups?.map((group) =>
            group.group_id === groupId ? { ...group, role: newRole } : group,
          );
        });
      }
    };

    const handleDemoteMember = (payload: GroupMemberResponse) => {
      const { groupId, newRole, targetUserDisplayId } = payload.data;
      const me = queryClient.getQueryData(meQueryOptions.queryKey);
      const isTarget = me?.display_id === targetUserDisplayId;
      queryClient.setQueryData(
        groupMembersQueryOptions(groupId).queryKey,
        (oldMembers) => {
          if (!oldMembers) return oldMembers;
          return oldMembers.map((member) =>
            member.display_id === targetUserDisplayId
              ? { ...member, role: newRole }
              : member,
          );
        },
      );

      if (isTarget) {
        queryClient.setQueryData(groupsQueryOptions.queryKey, (oldGroups) => {
          return oldGroups?.map((group) =>
            // Fix: Use 'role' to match your Page component's selector layout
            group.group_id === groupId ? { ...group, role: newRole } : group,
          );
        });
      }
    };

    const handleGroupSeenAck = (payload: GroupSeenResponse) => {
      const { groupId, userId, seenAt } = payload.data;
      const me = queryClient.getQueryData(meQueryOptions.queryKey);

      queryClient.setQueryData(groupsQueryOptions.queryKey, (oldGroups) => {
        return oldGroups?.map((group) => {
          if (group.group_id !== groupId) return group;

          if (userId === me?.id) {
            return { ...group, last_seen_at: seenAt, unread_count: 0 };
          }

          return group;
        });
      });

      if (userId === me?.id) {
        queryClient.setQueryData(groupsQueryOptions.queryKey, (oldGroups) => {
          return oldGroups?.map((group) =>
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
