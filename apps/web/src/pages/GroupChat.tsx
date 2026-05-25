import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Settings } from "lucide-react";
import { useState } from "react";
import { getInitials } from "@/features/groups/components/main-page/GroupAvatar";
import { useGroups } from "@/features/groups/hooks/useGroup";

export const GroupChatPage = () => {
  const { id } = useParams({ from: "/_authenticated/groups/$id/chat" });
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const { data: groups } = useGroups();
  const group = groups?.find((g) => g.group_id === id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate({ to: "/groups" })}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-medium text-emerald-400 shrink-0">
          {group?.name ? getInitials(group.name) : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {group?.name ?? "Group"}
          </p>
          <p className="text-xs text-muted-foreground">
            {group?.member_count ?? 0} members
          </p>
        </div>
        <Link to="/groups/$id/settings" params={{ id }}>
          <Button size="icon" variant="ghost">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-sm text-center text-muted-foreground">
          No messages yet.
        </p>
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-end gap-2">
          <div className="flex-1 border border-border rounded-xl overflow-hidden bg-muted/40">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="border-0 border-b border-border rounded-none bg-transparent font-medium focus-visible:ring-0 text-sm"
            />
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a message..."
              className="border-0 rounded-none bg-transparent focus-visible:ring-0 text-sm"
            />
          </div>
          <Button size="icon" disabled={!title.trim() && !body.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
