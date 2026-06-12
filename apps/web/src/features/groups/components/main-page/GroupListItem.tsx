import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { GroupAvatar } from "./GroupAvatar";
import type { Group } from "@domx/shared";
import { memo } from "react";

type Props = { group: Group; index: number };

export const GroupListItem = memo(({ group, index }: Props) => (
  <li className=" px-5 rounded">
    <Link
      to="/groups/$id/chat"
      params={{ id: group.group_id }}
      className="flex items-center gap-3 py-3.5"
    >
      <GroupAvatar name={group.name} index={index} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {group.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {group.member_count} members
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        {group.unread_count} unread
      </p>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  </li>
));
