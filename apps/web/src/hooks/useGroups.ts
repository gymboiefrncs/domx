import {
  changeGroupName,
  deleteGroup,
  createGroup,
  addMemberToGroup,
} from "@/services/group";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
import { useGroupContext } from "@/context/GroupContext";
import type { NewMember } from "@domx/shared";

export const useGroups = () => {
  const {
    groups,
    addGroup,
    renameGroupInList,
    deleteGroupInList,
    loading,
    incrementMemberCount,
  } = useGroupContext();

  const renameGroup = async (groupId: string, newName: string) => {
    try {
      await changeGroupName(groupId, newName);
      renameGroupInList(groupId, newName);
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    }
  };

  const removeGroup = async (groupId: string) => {
    try {
      await deleteGroup(groupId);
      deleteGroupInList(groupId);
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    }
  };

  const buildGroup = async (name: string, onSuccess: () => void) => {
    try {
      const data = await createGroup(name);
      addGroup(data);
      onSuccess(); // closes the modal after creating the group
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    }
  };

  const addMember = async (
    onSuccess: (newMember: NewMember) => void,
    groupId: string,
    displayId: string,
  ): Promise<void> => {
    try {
      const newMember = await addMemberToGroup(groupId, displayId);
      incrementMemberCount(groupId);

      onSuccess(newMember);
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    }
  };

  return {
    groups,
    loading,
    renameGroup,
    removeGroup,
    buildGroup,
    addMember,
  };
};
