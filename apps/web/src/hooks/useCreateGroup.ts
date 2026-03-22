import { useState } from "react";
import { createGroup } from "@/services/group";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
import type { CreateGroupState } from "@/shared";

export const useCreateGroup = (onSuccess: () => void): CreateGroupState => {
  const [loading, setLoading] = useState<boolean>(false);

  async function handleCreate(name: string) {
    setLoading(true);
    try {
      await createGroup(name);
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  }

  return { handleCreate, loading };
};
