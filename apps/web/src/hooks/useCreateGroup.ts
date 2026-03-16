import { useState } from "react";
import { createGroup } from "@/services/group";
import type { Group } from "@/components/GroupCard";

export const useCreateGroup = (onSuccess: (newGroup: Group) => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(name: string) {
    setLoading(true);
    setError(null);
    try {
      const newGroup = await createGroup(name);
      onSuccess(newGroup);
    } catch (err) {
      // use any for now since we don't have a defined error type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message);
    } finally {
      setLoading(false);
    }
  }

  return { handleCreate, loading, error };
};
