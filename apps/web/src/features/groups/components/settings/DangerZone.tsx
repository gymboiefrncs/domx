import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { socket } from "@/shared/lib/socket/socket.client";
import type { GroupRole } from "@domx/shared";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, TrashIcon } from "lucide-react";

type Props = {
  groupId: string;
  role: GroupRole;
};

export const GroupDangerZone = ({ groupId, role }: Props) => {
  const navigate = useNavigate();
  const handleDelete = () => {
    socket.emit("group:delete", groupId);
    navigate({ to: "/groups" });
  };

  return (
    <div className="px-5 py-4 border-t border-border space-y-2">
      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/40 hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4" />
        Leave Group
      </Button>

      <ConfirmDialog
        trigger={
          <Button
            variant="destructive"
            className={`w-full ${role !== "admin" ? "hidden" : ""}`}
          >
            <TrashIcon className="w-4 h-4" />
            Delete Group
          </Button>
        }
        title="Delete Group?"
        description="This action is irreversible. All members will lose access to the group chat and its contents."
        onConfirm={handleDelete}
      />
    </div>
  );
};
