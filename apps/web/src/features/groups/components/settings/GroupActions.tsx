import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import type { GroupRole } from "@domx/shared";
import { LogOut, Pencil, TrashIcon, UserPlus } from "lucide-react";

interface GroupActionsProps {
  role: GroupRole;
  onRename: () => void;
  onAddMember: () => void;
  onLeave: () => void;
  onDelete: () => void;
}

export const GroupActions = ({
  role,
  onRename,
  onAddMember,
  onLeave,
  onDelete,
}: GroupActionsProps) => {
  return (
    <div className="flex items-center justify-center flex-wrap gap-6 mt-1">
      {/* Rename Button */}
      {role === "admin" && (
        <button
          onClick={onRename}
          className={`flex-col items-center gap-1 cursor-pointer`}
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">Rename</span>
        </button>
      )}

      {/* Add Member Button */}
      <button
        onClick={onAddMember}
        className="flex flex-col items-center gap-1 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <UserPlus className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-xs text-muted-foreground">Add member</span>
      </button>

      {/* Leave Group Button */}
      <ConfirmDialog
        trigger={
          <button className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-destructive transition-colors">
              Leave
            </span>
          </button>
        }
        title="Leave Group?"
        description="You need to ask the admin to be re-added if you change your mind. If you are the only admin, consider promoting another member to admin before leaving."
        onConfirm={onLeave}
      />

      {/* Delete Group Button (Admin Only) */}
      {role === "admin" && (
        <ConfirmDialog
          trigger={
            <button className="flex flex-col items-center gap-1 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                <TrashIcon className="w-4 h-4 text-destructive/80 group-hover:text-destructive transition-colors" />
              </div>
              <span className="text-xs text-destructive/80 group-hover:text-destructive transition-colors">
                Delete
              </span>
            </button>
          }
          title="Delete Group?"
          description="This action is irreversible. All members will lose access to the group chat and its contents."
          onConfirm={onDelete}
        />
      )}
    </div>
  );
};
