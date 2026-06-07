import { AddMemberModal } from "@/features/groups/components/modal/AddMemberModal";
import {
  groupMembersQueryOptions,
  groupsQueryOptions,
} from "@/features/groups/queries";
import { useModalStore } from "@/features/groups/store/group.modal";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { GroupHero } from "@/features/groups/components/settings/Hero";
import { MemberListItem } from "@/features/groups/components/settings/MemberList";
import { GroupDangerZone } from "@/features/groups/components/settings/DangerZone";
import { meQueryOptions } from "@/features/profile/queries";
import { useSuspenseQuery } from "@tanstack/react-query";

export const GroupSettingsPage = () => {
  const { id } = useParams({ from: "/_authenticated/groups/$id/settings" });
  const { data: groups } = useSuspenseQuery(groupsQueryOptions);
  const { data: members } = useSuspenseQuery(groupMembersQueryOptions(id));
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const group = groups.find((g) => g.group_id === id)!;
  const role = members.find((m) => m.display_id === me?.display_id)!.role;
  const openModal = useModalStore((state) => state.openModal);
  const navigate = useNavigate();

  if (!group) return <Navigate to="/groups" replace />;

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
      <GroupHero
        name={group.name}
        role={role}
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
              role={role}
              groupId={group.group_id}
              groupRole={member.role}
            />
          ))
        )}
      </ul>

      <GroupDangerZone groupId={group.group_id} role={role} />
      <AddMemberModal />
    </div>
  );
};
