import { useGroups } from "@/features/groups/hooks/useGroup";
import { useModalStore } from "@/features/groups/store/group.modal";
import { CreateGroupModal } from "@/features/groups/components/modal/CreateGroupModal";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupPageHeader } from "@/features/groups/components/main-page/GroupPageHeader";
import { GroupListItem } from "@/features/groups/components/main-page/GroupListItem";
import { useLogout } from "@/features/auth/hooks/useAuth";

export const GroupPage = () => {
  const { data: groups, isLoading, isError } = useGroups();
  const openModal = useModalStore((state) => state.openModal);
  const { handleLogout } = useLogout();

  if (isLoading)
    return (
      <div className="px-5 pt-8 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3.5">
            <Skeleton className="w-11 h-11 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );

  if (isError)
    return <p className="p-6 text-sm text-red-400">Error loading groups.</p>;

  return (
    <div className="flex flex-col h-full md:pb-6">
      <GroupPageHeader
        count={groups?.length ?? 0}
        onCreateClick={() => openModal("create-group")}
        onLogoutClick={() => handleLogout()}
      />
      {!groups?.length ? (
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
