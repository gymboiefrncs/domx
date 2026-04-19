import {
  createContext,
  useContext,
  useEffect,
  useState,
  type JSX,
} from "react";
import type { GroupDetail } from "@domx/shared";
import type { GroupContextType } from "@/features/groups/types";
import { fetchMyGroups } from "@/features/groups/index";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { useAuthContext } from "./AuthContext";
import { connectPostSocket, joinPostGroup } from "@/features/posts";

const GroupContext = createContext<GroupContextType | null>(null);

export function GroupProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [groups, setGroups] = useState<GroupDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuthContext();

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

  const setGroupRoleInList = (groupId: string, role: GroupDetail["role"]) => {
    setGroups((prev) =>
      prev.map((g) => (g.group_id === groupId ? { ...g, role } : g)),
    );
  };

  const incrementMemberCount = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.group_id === groupId ? { ...g, member_count: g.member_count + 1 } : g,
      ),
    );
  };

  const decrementMemberCount = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.group_id === groupId
          ? { ...g, member_count: Math.max(0, g.member_count - 1) }
          : g,
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

  useEffect(() => {
    if (!user) return;

    const socket = connectPostSocket({
      onOpen: () => {
        groups.forEach((g) => {
          joinPostGroup(socket, g.group_id);
        });
      },
      onMessage: (message) => {
        if (!("type" in message)) return;

        if (message.type === "memberAdded") {
          if (message.data.display_id === user.display_id) {
            void fetchMyGroups()
              .then((updatedGroups) => {
                setGroups(updatedGroups);
                joinPostGroup(socket, message.data.group_id);
              })
              .catch((err) => {
                toast.error(getErrorMessage(err), { duration: 2000 });
              });
            toast.success("You have been added to the group", {
              duration: 2000,
            });
            return;
          }

          incrementMemberCount(message.data.group_id);
          return;
        }

        if (message.type === "memberKicked") {
          if (message.data.displayId === user.display_id) {
            deleteGroupInList(message.data.groupId);
            toast.error(
              message.message ?? "You have been removed from the group",
            );
          } else {
            decrementMemberCount(message.data.groupId);
          }
          return;
        }

        if (message.type === "memberPromoted") {
          if (message.data.displayId === user.display_id) {
            setGroupRoleInList(message.data.groupId, "admin");
            toast.success("You have been promoted", { duration: 2000 });
          }
          return;
        }

        if (message.type === "memberDemoted") {
          if (message.data.displayId === user.display_id) {
            setGroupRoleInList(message.data.groupId, "member");
            toast.success("You have been demoted", { duration: 2000 });
          }
          return;
        }

        if (message.type === "groupLeft") {
          if (message.data.displayId === user.display_id) {
            deleteGroupInList(message.data.groupId);
            return;
          }

          decrementMemberCount(message.data.groupId);
        }
      },
      onError: () => {},
    });
    return () => socket.close();
  }, [groups, user]);

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
        decrementMemberCount,
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
