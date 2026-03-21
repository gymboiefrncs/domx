import { useState } from "react";
import { createGroup } from "@/services/group";
import type { Group } from "@/components/GroupCard";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";

export const useCreateGroup = (onSuccess: (newGroup: Group) => void) => {
  const [loading, setLoading] = useState(false);

  async function handleCreate(name: string) {
    setLoading(true);
    try {
      const newGroup = await createGroup(name);
      onSuccess(newGroup);
    } catch (err) {
      toast.error(getErrorMessage(err), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  }

  return { handleCreate, loading };
};
