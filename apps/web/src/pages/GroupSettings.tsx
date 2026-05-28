import { AddMemberModal } from "@/features/groups/components/modal/AddMemberModal";
import { useGroupMembers, useGroups } from "@/features/groups/hooks/useGroup";
import { useModalStore } from "@/features/groups/store/group.modal";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { GroupHero } from "@/features/groups/components/settings/Hero";
import { MemberListItem } from "@/features/groups/components/settings/MemberList";
import { GroupDangerZone } from "@/features/groups/components/settings/DangerZone";
import { useMe } from "@/features/profile/hooks/useProfile";
import { useEffect } from "react";

export const GroupSettingsPage = () => {
  const { id } = useParams({ from: "/_authenticated/groups/$id/settings" });
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const openModal = useModalStore((state) => state.openModal);
  const { data: members, isLoading, isError } = useGroupMembers(id);
  const navigate = useNavigate();
  const group = groups?.find((g) => g.group_id === id);
  const { data: me } = useMe();
  const role = members?.find((m) => m.display_id === me?.display_id)?.role;

  useEffect(() => {
    if (isGroupsLoading) return;

    if (!group) {
      navigate({ to: "/groups" });
    }
  }, [group, navigate, isGroupsLoading]);

  if (isLoading)
    return (
      <div className="px-5 pt-8 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3.5">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );

  if (isError)
    return (
      <p className="px-5 py-12 text-sm text-center text-destructive">
        Error loading members.
      </p>
    );

  if (!group) return null;
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-4 pb-3">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate({ to: "/groups/$id/chat", params: { id } })}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>
      {/* TODO: add rename functionality */}
      <GroupHero
        name={group.name}
        role={role ?? "member"}
        groupId={group.group_id}
        onAddMember={() => openModal("add-member")}
      />

      <div className="px-5 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">
          Members
          <span className="ml-2 text-muted-foreground font-normal">
            {group?.member_count ?? 0}
          </span>
        </p>
      </div>

      <ul className="divide-y divide-border px-2 lg:px-5 flex-1 overflow-y-auto">
        {!members?.length ? (
          <p className="px-5 py-12 text-sm text-center text-muted-foreground">
            No members found.
          </p>
        ) : (
          members.map((member) => (
            <MemberListItem
              key={member.display_id}
              username={member.username}
              displayId={member.display_id}
              role={role ?? "member"}
              groupId={group.group_id}
            />
          ))
        )}
      </ul>

      {/* TODO: implement leave and delete group functionality */}
      <GroupDangerZone groupId={group.group_id} role={role ?? "member"} />
      <AddMemberModal />
    </div>
  );
};
