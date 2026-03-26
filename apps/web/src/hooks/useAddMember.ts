import { addMemberToGroup } from "@/services/group";
import type { AddMemberState } from "@/shared";
import { getErrorMessage } from "@/utils/error";
import type { NewMember } from "@domx/shared";
import { useState } from "react";
import { toast } from "sonner";

export const useAddMember = (
  onSuccess: (newMember: NewMember) => void,
): AddMemberState => {
  const [loading, setLoading] = useState<boolean>(false);

  async function handleAddMember(
    groupId: string,
    displayId: string,
  ): Promise<void> {
    setLoading(true);
    try {
      const newMember = await addMemberToGroup(groupId, displayId);
      onSuccess(newMember);
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  }
  return { handleAddMember, loading };
};
