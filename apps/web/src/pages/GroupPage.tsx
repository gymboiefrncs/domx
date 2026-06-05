import { groupsQueryOptions } from "@/features/groups/queries";
import { useModalStore } from "@/features/groups/store/group.modal";
import { CreateGroupModal } from "@/features/groups/components/modal/CreateGroupModal";
import { GroupPageHeader } from "@/features/groups/components/main-page/GroupPageHeader";
import { GroupListItem } from "@/features/groups/components/main-page/GroupListItem";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { useSuspenseQuery } from "@tanstack/react-query";

export const GroupPage = () => {
  const { data: groups } = useSuspenseQuery(groupsQueryOptions);
  const openModal = useModalStore((state) => state.openModal);
  const { handleLogout } = useLogout();

  return (
    <div className="flex flex-col h-full md:pb-6">
      <GroupPageHeader
        count={groups.length}
        onCreateClick={() => openModal("create-group")}
        onLogoutClick={() => handleLogout()}
      />
      {groups.length === 0 ? (
        <p className="px-5 py-12 text-sm text-center text-gray-400">
          No groups yet.
        </p>
      ) : (
        <ul className="divide-y divide-border px-2 lg:px-5 flex-1 overflow-y-auto py-2 md:py-0">
          {groups.map((group, i) => (
            <GroupListItem key={group.group_id} group={group} index={i} />
          ))}
        </ul>
      )}
      <CreateGroupModal />
    </div>
  );
};
