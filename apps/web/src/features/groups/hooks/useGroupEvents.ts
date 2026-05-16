import { useMe } from "@/features/profile";
import type { Group, Member, PostDetails } from "@domx/shared";
import { joinPostGroup } from "@/features/posts";

interface Deps {
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  addGroup: (data: Group) => void;
  deleteGroupInList: (groupId: string) => void;
  incrementUnreadCount: (groupId: string) => void;
  setGroupRoleInList: (groupId: string, role: Group["role"]) => void;
  incrementMemberCount: (groupId: string) => void;
  decrementMemberCount: (groupId: string) => void;
}

export const useGroupEvents = (deps: Deps) => {
  const { data: user } = useMe();

  const {
    addGroup,
    deleteGroupInList,
    incrementUnreadCount,
    setGroupRoleInList,
    incrementMemberCount,
    decrementMemberCount,
  } = deps;

  const isGroupOpen = (groupid: string): boolean =>
    window.location.pathname.startsWith(`/groups/${groupid}`);

  const onNewMessage = (data: PostDetails) => {
    const { group_id, display_id } = data;
    /**
     * isGroupOpen check is to prevent showing toast for new messages
     * if the user is currently viewing that group
     */
    if (!group_id || display_id === user?.display_id || isGroupOpen(group_id))
      return;

    incrementUnreadCount(group_id);
  };

  const onMemberAdded = async ({
    data,
    group,
  }: {
    data: Member;
    group?: Group;
  }) => {
    /**
     * 2 scenaris can happen, SOMEONE gets added and YOU got added.
     * for the first one, we just increment the member count, for the second one
     * we need refetch the groups to get the new group added to the list and
     * also join the post socket for that group to receive new messages in that group.
     */

    if (data.display_id === user?.display_id) {
      addGroup(group!);
      joinPostGroup(data.group_id);
      return;
    }

    // SOMEONE gets added, just increment the member count for that group in the list
    incrementMemberCount(data.group_id);
  };

  const onMemberKicked = (data: { groupId: string; displayId: string }) => {
    data.displayId === user?.display_id
      ? deleteGroupInList(data.groupId)
      : decrementMemberCount(data.groupId);
  };

  const onMemberPromoted = (data: { groupId: string; displayId: string }) => {
    if (data.displayId !== user?.display_id) return;
    setGroupRoleInList(data.groupId, "admin");
  };

  const onMemberDemoted = (data: { groupId: string; displayId: string }) => {
    if (data.displayId !== user?.display_id) return;
    setGroupRoleInList(data.groupId, "member");
  };

  const onGroupLeft = (data: { groupId: string; displayId?: string }) => {
    data.displayId === user?.display_id
      ? deleteGroupInList(data.groupId)
      : decrementMemberCount(data.groupId);
  };

  const onGroupDeleted = (data: { groupId: string }) => {
    deleteGroupInList(data.groupId);
  };

  return {
    onNewMessage,
    onMemberAdded,
    onMemberKicked,
    onMemberPromoted,
    onMemberDemoted,
    onGroupLeft,
    onGroupDeleted,
  };
};
