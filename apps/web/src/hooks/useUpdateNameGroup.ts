import { useState } from "react";
import { changeGroupName } from "@/services/group";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
// import type { UpdateGroupNameState } from "@/shared";

export const useUpdateNameGroup = () => {
  const [loading, setLoading] = useState<boolean>(false);

  async function handleUpdateName(groupId: string, newName: string) {
    setLoading(true);
    try {
      await changeGroupName(groupId, newName);
      toast.success("Group name updated", { duration: 2000 });
    } catch (err) {
      toast.error(getErrorMessage(err), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  }

  return { handleUpdateName, loading };
};
