import { Button } from "@/components/ui/button";
import { socket } from "@/shared/lib/socket/socket.client";
import type { GroupRole } from "@domx/shared";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  UserMinus,
  X,
} from "lucide-react";
import { useState } from "react";

interface Props {
  username: string;
  displayId: string;
  role: GroupRole; // for permissions
  groupId: string;
  groupRole: GroupRole; // for display
}

type Actions = "promote" | "demote" | "kick" | null;

export const MemberListItem = ({
  username,
  displayId,
  role,
  groupId,
  groupRole,
}: Props) => {
  const [confirmAction, setConfirmAction] = useState<Actions>(null);

  const handleKick = () => {
    socket.emit("group:member:kick", {
      groupId,
      targetUserDisplayId: displayId,
    });
    setConfirmAction(null);
  };

  const handleRoleChange = () => {
    if (confirmAction === "promote") {
      socket.emit("group:member:promote", {
        groupId,
        targetUserDisplayId: displayId,
      });
    } else if (confirmAction === "demote") {
      socket.emit("group:member:demote", {
        groupId,
        targetUserDisplayId: displayId,
      });
    }

    setConfirmAction(null);
  };

  return (
    <li className="flex items-center gap-3 px-3 py-3.5">
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
        {username.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex flex-col">
        <p className="text-sm font-medium text-foreground">{username}</p>
        <p className="text-xs text-muted-foreground">{groupRole}</p>
      </div>
      {role === "admin" && (
        <div className="ml-auto flex items-center gap-2">
          {confirmAction === null ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setConfirmAction(groupRole === "admin" ? "demote" : "promote")
                }
              >
                {groupRole === "admin" ? (
                  <ArrowDownCircle />
                ) : (
                  <ArrowUpCircle />
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmAction("kick")}
              >
                <UserMinus />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {confirmAction === "kick" && `Kick ${username}?`}
                {confirmAction === "promote" && `Promote ${username}?`}
                {confirmAction === "demote" && `Demote ${username}?`}
              </span>
              <Button
                size="sm"
                variant={confirmAction === "kick" ? "destructive" : "default"}
                className={
                  confirmAction === "promote"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
                onClick={
                  confirmAction === "kick" ? handleKick : handleRoleChange
                }
              >
                <Check />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmAction(null)}
              >
                <X />
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
};
