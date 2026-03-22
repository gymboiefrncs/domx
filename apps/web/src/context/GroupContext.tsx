import { createContext, useContext, useState, useEffect } from "react";
import { fetchMyGroups } from "@/services/group";
import type { Group } from "@/components/GroupCard";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";

type GroupContextType = {
  groups: Group[];
  loading: boolean;
  loadGroups: () => Promise<void>;
};

const GroupContext = createContext<GroupContextType | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await fetchMyGroups();
      setGroups(data ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <GroupContext.Provider value={{ groups, loading, loadGroups }}>
      {children}
    </GroupContext.Provider>
  );
}

// Custom hook so components don't import useContext and GroupContext separately
export function useGroups() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroups must be used within a GroupProvider");
  return ctx;
}
