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
import { meQueryOptions } from "@/features/profile/queries";
import { useSuspenseQuery } from "@tanstack/react-query";

export const GroupSettingsPage = () => {
  const { id } = useParams({ from: "/_authenticated/groups/$id/settings" });
  const { data: group } = useSuspenseQuery({
    ...groupsQueryOptions,
    select: (groups) => groups.find((g) => g.group_id === id),
  });
  const { data } = useSuspenseQuery({
    ...groupMembersQueryOptions(id),
    select: (members) => ({
      members,
      admins: members.filter((m) => m.role === "admin"),
      regularMembers: members.filter((m) => m.role === "member"),
    }),
  });
  const { admins, regularMembers, members } = data;

  const { data: me } = useSuspenseQuery(meQueryOptions);

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
      <div className="overflow-y-auto py-2">
        {admins.length > 0 && (
          <div className="px-5">
            <p className="text-sm font-medium text-foreground mb-2">
              Chat Info
            </p>
            <p className="text-xs font-bold text-muted-foreground mb-2">
              Admins
            </p>
            <ul className="divide-y divide-muted rounded-md border">
              {admins.map((member) => (
                <MemberListItem
                  key={member.display_id}
                  username={member.username}
                  displayId={member.display_id}
                  role={role}
                  groupId={group.group_id}
                  groupRole={member.role}
                />
              ))}
            </ul>
          </div>
        )}
        {regularMembers.length > 0 && (
          <div className="px-5 mt-6">
            <p className="text-xs font-bold text-muted-foreground mb-2">
              Members
            </p>
            <ul className="divide-y divide-muted rounded-md border">
              {regularMembers.map((member) => (
                <MemberListItem
                  key={member.display_id}
                  username={member.username}
                  displayId={member.display_id}
                  role={role}
                  groupId={group.group_id}
                  groupRole={member.role}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      <AddMemberModal />
    </div>
  );
};
