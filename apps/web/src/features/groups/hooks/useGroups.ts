import {
  changeGroupName,
  deleteGroup,
  createGroup,
  addMemberInGroup,
  markGroupAsSeen,
  promoteMemberInGroup,
  demoteMemberInGroup,
  kickMemberFromGroup,
  leaveGroupById,
} from "../transport";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { useGroupContext } from "@/providers/GroupContext";
import type { NewMember } from "@domx/shared";

export const useGroups = () => {
  const {
    groups,
    addGroup,
    renameGroupInList,
    deleteGroupInList,
    loading,
    clearUnreadCount,
  } = useGroupContext();

  const renameGroup = async (groupId: string, newName: string) => {
    try {
      await changeGroupName(groupId, newName);
      renameGroupInList(groupId, newName);
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    }
  };

  const removeGroup = async (groupId: string): Promise<boolean> => {
    try {
      await deleteGroup(groupId);
      deleteGroupInList(groupId);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
      return false;
    }
  };

  const promoteMember = async (
    groupId: string,
    displayId: string,
  ): Promise<boolean> => {
    try {
      await promoteMemberInGroup(groupId, displayId);
      toast.success("Member has been promoted", { duration: 2000 });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
      return false;
    }
  };

  const demoteMember = async (
    groupId: string,
    displayId: string,
  ): Promise<boolean> => {
    try {
      await demoteMemberInGroup(groupId, displayId);
      toast.success("Member has been demoted", { duration: 2000 });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
      return false;
    }
  };

  const kickMember = async (
    groupId: string,
    displayId: string,
  ): Promise<boolean> => {
    try {
      await kickMemberFromGroup(groupId, displayId);
      toast.success("Member removed", { duration: 2000 });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
      return false;
    }
  };

  const leaveGroup = async (groupId: string): Promise<boolean> => {
    try {
      await leaveGroupById(groupId);
      deleteGroupInList(groupId);
      toast.success("You left the group", { duration: 2000 });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
      return false;
    }
  };

  const buildGroup = async (name: string): Promise<boolean> => {
    try {
      const data = await createGroup(name);
      addGroup(data);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
      return false;
    }
  };

  const addMember = async (
    onSuccess: (newMember: NewMember) => void,
    groupId: string,
    displayId: string,
  ): Promise<void> => {
    try {
      const newMember = await addMemberInGroup(groupId, displayId);
      toast.success("Member added", { duration: 2000 });

      onSuccess(newMember);
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    }
  };

  const markGroupSeen = async (groupId: string): Promise<void> => {
    clearUnreadCount(groupId);
    try {
      await markGroupAsSeen(groupId);
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    }
  };

  return {
    groups,
    loading,
    renameGroup,
    removeGroup,
    promoteMember,
    demoteMember,
    kickMember,
    leaveGroup,
    buildGroup,
    addMember,
    markGroupSeen,
  };
};
