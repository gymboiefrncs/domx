import { Button } from "@/components/ui/button";
import { socket } from "@/shared/lib/socket/socket.client";
import type { GroupRole } from "@domx/shared";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  username: string;
  displayId: string;
  role: GroupRole;
  groupId: string;
}

type Actions = "promote" | "demote" | "kick" | null;

export const MemberListItem = ({
  username,
  displayId,
  role,
  groupId,
}: Props) => {
  const [confirmAction, setConfirmAction] = useState<Actions>(null);
  const handleKick = () => {
    socket.emit("group:member:kick", {
      groupId,
      targetUserDisplayId: displayId,
    });
  };

  return (
    <li className="flex items-center gap-3 px-3 py-3.5">
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
        {username.slice(0, 2).toUpperCase()}
      </div>
      <p className="text-sm font-medium text-foreground">{username}</p>
      <p className="text-xs text-muted-foreground">({displayId})</p>
      {role === "admin" && (
        <div className="ml-auto flex items-center gap-2">
          {confirmAction === null ? (
            <>
              <Button size="sm" variant="outline">
                {role === "admin" ? "Demote" : "Promote"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmAction("kick")}
              >
                Kick
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Are you sure you want to kick {username}?
              </span>
              <Button size="sm" variant="destructive" onClick={handleKick}>
                Yes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmAction(null)}
              >
                No
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
};
