import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Settings } from "lucide-react";
import { getInitials } from "@/features/groups/components/main-page/GroupAvatar";
import type { Group } from "@domx/shared";

interface GroupChatHeaderProps {
  groupId: string;
  group: Group;
}

export const GroupChatHeader = ({ groupId, group }: GroupChatHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => navigate({ to: "/groups" })}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-medium text-emerald-400 shrink-0">
        {getInitials(group.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {group.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {group.member_count} members
        </p>
      </div>
      <Link to="/groups/$id/settings" params={{ id: groupId }}>
        <Button size="icon" variant="ghost">
          <Settings className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
};
