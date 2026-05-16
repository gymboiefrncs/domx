import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type JSX,
} from "react";
import type { Group } from "@domx/shared";
import type { GroupContextType } from "@/features/groups/types";
import { fetchMyGroups } from "@/features/groups/index";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { useMe } from "@/features/profile";
import { connectPostSocket, joinPostGroup } from "@/features/posts";
import { useGroupEvents } from "@/features/groups/hooks/useGroupEvents";

const GroupContext = createContext<GroupContextType | null>(null);

export function GroupProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { data: user } = useMe();
  const groupsRef = useRef(groups);

  const addGroup = (data: Group) => {
    setGroups((prev) => {
      const existingIndex = prev.findIndex((g) => g.group_id === data.group_id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], ...data };
        return next;
      }

      return [data, ...prev];
    });
  };

  const renameGroupInList = (groupId: string, newName: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.group_id === groupId ? { ...g, name: newName } : g)),
    );
  };

  const deleteGroupInList = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.group_id !== groupId));
  };

  const setGroupRoleInList = (groupId: string, role: Group["role"]) => {
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

  const incrementUnreadCount = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.group_id === groupId
          ? { ...g, unread_count: Math.max(0, g.unread_count + 1) }
          : g,
      ),
    );
  };

  const events = useGroupEvents({
    setGroups,
    addGroup,
    deleteGroupInList,
    incrementUnreadCount,
    setGroupRoleInList,
    incrementMemberCount,
    decrementMemberCount,
  });

  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    if (!user) return;

    const socket = connectPostSocket({
      onOpen: () => {
        groupsRef.current.forEach((g) => joinPostGroup(g.group_id));
      },
      onMessage: (message) => {
        if (!("type" in message)) return;

        switch (message.type) {
          case "newMessage":
            eventsRef.current.onNewMessage(message.data);
            break;
          case "memberAdded":
            eventsRef.current.onMemberAdded(message);
            break;
          case "memberKicked":
            eventsRef.current.onMemberKicked(message.data);
            break;
          case "memberPromoted":
            eventsRef.current.onMemberPromoted(message.data);
            break;
          case "memberDemoted":
            eventsRef.current.onMemberDemoted(message.data);
            break;
          case "groupLeft":
            eventsRef.current.onGroupLeft(message.data);
            break;
          case "groupDeleted":
            eventsRef.current.onGroupDeleted(message.data);
            break;
        }
      },
      onError: () => {},
    });
    return () => socket();
  }, [user]);

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
