import {
  createContext,
  useContext,
  useState,
  useEffect,
  type JSX,
} from "react";
import { fetchMyGroups } from "@/services/group";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
import type { GroupDetail } from "@domx/shared";
import type { GroupContextType } from "@/shared";

const GroupContext = createContext<GroupContextType | null>(null);

export function GroupProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [groups, setGroups] = useState<GroupDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await fetchMyGroups();
      setGroups(data);
    } catch (err) {
      toast.error(getErrorMessage(err), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const updateGroupName = (groupId: string, newName: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.group_id === groupId ? { ...g, name: newName } : g)),
    );
  };

  const deleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.group_id !== groupId));
  };

  useEffect((): void => {
    loadGroups();
  }, []);

  return (
    <GroupContext.Provider
      value={{ groups, loading, loadGroups, updateGroupName, deleteGroup }}
    >
      {children}
    </GroupContext.Provider>
  );
}

// Custom hook so components don't import useContext and GroupContext separately
export const useGroups = (): GroupContextType => {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroups must be used within a GroupProvider");
  return ctx;
};
