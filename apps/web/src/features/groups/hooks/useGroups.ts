import {
  changeGroupName,
  deleteGroupByIdWs,
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
import type { Member } from "@domx/shared";

export const useGroups = () => {
  const TOAST_DURATION = 2000;
  const {
    groups,
    addGroup,
    renameGroupInList,
    deleteGroupInList,
    loading,
    clearUnreadCount,
  } = useGroupContext();

  const notifyError = (error: unknown) => {
    toast.error(getErrorMessage(error), { duration: TOAST_DURATION });
  };

  const renameGroup = async (groupId: string, newName: string) => {
    try {
      await changeGroupName(groupId, newName);
      renameGroupInList(groupId, newName);
    } catch (error) {
      notifyError(error);
    }
  };

  const removeGroup = async (groupId: string): Promise<boolean> => {
    try {
      await deleteGroupByIdWs(groupId);
      deleteGroupInList(groupId);
      return true;
    } catch (error) {
      notifyError(error);
      return false;
    }
  };

  const promoteMember = async (
    groupId: string,
    displayId: string,
  ): Promise<boolean> => {
    try {
      await promoteMemberInGroup(groupId, displayId);
      return true;
    } catch (error) {
      notifyError(error);
      return false;
    }
  };

  const demoteMember = async (
    groupId: string,
    displayId: string,
  ): Promise<boolean> => {
    try {
      await demoteMemberInGroup(groupId, displayId);
      return true;
    } catch (error) {
      notifyError(error);
      return false;
    }
  };

  const kickMember = async (
    groupId: string,
    displayId: string,
  ): Promise<boolean> => {
    try {
      await kickMemberFromGroup(groupId, displayId);
      return true;
    } catch (error) {
      notifyError(error);
      return false;
    }
  };

  const leaveGroup = async (groupId: string): Promise<boolean> => {
    try {
      await leaveGroupById(groupId);
      deleteGroupInList(groupId);
      return true;
    } catch (error) {
      notifyError(error);
      return false;
    }
  };

  const buildGroup = async (name: string): Promise<boolean> => {
    try {
      const data = await createGroup(name);
      addGroup(data);
      return true;
    } catch (error) {
      notifyError(error);
      return false;
    }
  };

  const addMember = async (
    onSuccess: (newMember: Member) => void,
    groupId: string,
    displayId: string,
  ): Promise<void> => {
    try {
      const newMember = await addMemberInGroup(groupId, displayId);
      onSuccess(newMember);
    } catch (error) {
      notifyError(error);
    }
  };

  const markGroupSeen = async (groupId: string): Promise<void> => {
    clearUnreadCount(groupId);
    try {
      await markGroupAsSeen(groupId);
    } catch (error) {
      notifyError(error);
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
