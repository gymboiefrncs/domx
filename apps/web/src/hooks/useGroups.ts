import { useState } from "react";
import {
  fetchMyGroups,
  changeGroupName,
  deleteGroup,
  createGroup,
} from "@/services/group";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
import { useGroupContext } from "@/context/GroupContext";

export const useGroups = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { groups, setGroupList, renameGroupInList, deleteGroupInList } =
    useGroupContext();

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await fetchMyGroups();
      setGroupList(data);
    } catch (err) {
      toast.error(getErrorMessage(err), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const renameGroup = async (groupId: string, newName: string) => {
    setLoading(true);
    try {
      await changeGroupName(groupId, newName);
      renameGroupInList(groupId, newName);
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const removeGroup = async (groupId: string) => {
    setLoading(true);
    try {
      await deleteGroup(groupId);
      deleteGroupInList(groupId);
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Not in context because the api do not return the full group detail
   */
  const buildGroup = async (name: string, onSuccess: () => void) => {
    setLoading(true);
    try {
      await createGroup(name);
      loadGroups();
      onSuccess(); // closes the modal after creating the group
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  return {
    groups,
    loading,
    loadGroups,
    renameGroup,
    removeGroup,
    buildGroup,
  };
};
