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

  const setGroupList = (data: GroupDetail[]) => {
    setGroups(data);
  };
  const renameGroupInList = (groupId: string, newName: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.group_id === groupId ? { ...g, name: newName } : g)),
    );
  };
  const deleteGroupInList = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.group_id !== groupId));
  };

  // fetch groups on mount
  useEffect(() => {
    fetchMyGroups()
      .then((data) => setGroupList(data))
      .catch((err) => {
        toast.error(getErrorMessage(err), { duration: 2000 });
      });
  }, []);

  return (
    <GroupContext.Provider
      value={{
        groups,
        setGroupList,
        renameGroupInList,
        deleteGroupInList,
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
