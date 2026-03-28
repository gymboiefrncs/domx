import { deleteGroup } from "@/services/group";
import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useDeleteGroup = () => {
  const [loadingDelete, setLoadingDelete] = useState(false);
  const navigate = useNavigate();

  async function handleDeleteGroup(groupId: string) {
    setLoadingDelete(true);
    try {
      await deleteGroup(groupId);
      navigate("/groups");
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    } finally {
      setLoadingDelete(false);
    }
  }
  return { handleDeleteGroup, loadingDelete };
};
