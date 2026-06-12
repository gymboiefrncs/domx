import { AddMemberModal } from "@/features/groups/components/modal/AddMemberModal";
import { groupsQueryOptions } from "@/features/groups/queries";
import { useModalStore } from "@/features/groups/store/group.modal";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { GroupHero } from "@/features/groups/components/settings/Hero";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MemberList } from "@/features/groups/components/settings/MemberList";

export const GroupSettingsPage = () => {
  const { id } = useParams({ from: "/_authenticated/groups/$id/settings" });
  const { data: group } = useSuspenseQuery({
    ...groupsQueryOptions,
    select: (groups) => {
      const group = groups.find((g) => g.group_id === id);
      if (!group) return undefined;
      return {
        group_id: group.group_id,
        name: group.name,
        role: group.role,
      };
    },
  });

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
        myRole={group.role}
        groupId={group.group_id}
        onAddMember={() => openModal("add-member")}
      />

      <MemberList groupId={group.group_id} myRole={group.role} />

      <AddMemberModal />
    </div>
  );
};
