import { createContext, useContext, useState, useEffect } from "react";
import { fetchMyGroups } from "@/services/group";
import type { Group } from "@/components/GroupCard";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";

type GroupContextType = {
  groups: Group[];
  loading: boolean;
  addGroup: (group: Group) => void;
};

const GroupContext = createContext<GroupContextType | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchMyGroups();
        setGroups(data ?? []);
      } catch (err) {
        toast.error(getErrorMessage(err), { duration: 2000 });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function addGroup(newGroup: Group) {
    setGroups((prev) => [...prev, newGroup]);
  }

  return (
    <GroupContext.Provider value={{ groups, loading, addGroup }}>
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
