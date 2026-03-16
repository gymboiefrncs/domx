import { createContext, useContext, useState, useEffect } from "react";
import { fetchMyGroups } from "@/services/group";
import type { Group } from "@/components/GroupCard";

type GroupContextType = {
  groups: Group[];
  loading: boolean;
  error: string | null;
  addGroup: (group: Group) => void;
};

const GroupContext = createContext<GroupContextType | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMyGroups();
        setGroups(data ?? []);
      } catch (err) {
        setError((err as any).message);
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
    <GroupContext.Provider value={{ groups, loading, error, addGroup }}>
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
