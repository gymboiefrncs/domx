import {
  createContext,
  useContext,
  useEffect,
  useState,
  type JSX,
} from "react";
import type { GroupDetail } from "@domx/shared";
import type { GroupContextType } from "@/shared";
import { fetchMyGroups } from "@/services/group";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";

const GroupContext = createContext<GroupContextType | null>(null);

export function GroupProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [groups, setGroups] = useState<GroupDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const addGroup = (data: GroupDetail) => {
    setGroups((prev) => [data, ...prev]);
  };

  const renameGroupInList = (groupId: string, newName: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.group_id === groupId ? { ...g, name: newName } : g)),
    );
  };

  const deleteGroupInList = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.group_id !== groupId));
  };

  const incrementMemberCount = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.group_id === groupId ? { ...g, member_count: g.member_count + 1 } : g,
      ),
    );
  };

  const clearUnreadCount = (groupId: string) => {
    setGroups((prev) => {
      let changed = false;

      const next = prev.map((g) => {
        if (g.group_id !== groupId || g.unread_count === 0) {
          return g;
        }

        changed = true;
        return { ...g, unread_count: 0 };
      });

      return changed ? next : prev;
    });
  };

  // fetch groups on mount
  useEffect(() => {
    fetchMyGroups()
      .then((data) => setGroups(data))
      .catch((err) => {
        toast.error(getErrorMessage(err), { duration: 2000 });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <GroupContext.Provider
      value={{
        groups,
        loading,
        addGroup,
        renameGroupInList,
        deleteGroupInList,
        incrementMemberCount,
        clearUnreadCount,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

// Custom hook so components don't import useContext and GroupContext separately
export const useGroupContext = (): GroupContextType => {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroups must be used within a GroupProvider");
  return ctx;
};
