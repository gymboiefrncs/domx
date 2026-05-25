import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, UserPlus } from "lucide-react";
import { getInitials } from "../main-page/GroupAvatar";

type Props = {
  name: string;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onNameChange: (val: string) => void;
  onAddMember: () => void;
};

export const GroupHero = ({
  name,
  isEditing,
  onEditStart,
  onEditEnd,
  onNameChange,
  onAddMember,
}: Props) => (
  <div className="flex flex-col items-center gap-3 px-5 py-6 border-b border-border">
    <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-2xl font-medium text-emerald-400 shrink-0">
      {getInitials(name)}
    </div>

    {isEditing ? (
      <div className="flex items-center gap-2 w-full max-w-xs">
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="text-center"
          autoFocus
        />
        <Button size="sm" onClick={onEditEnd}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onEditEnd}>
          Cancel
        </Button>
      </div>
    ) : (
      <p className="text-xl font-medium text-foreground">{name}</p>
    )}

    <div className="flex items-center gap-6 mt-1">
      <button
        onClick={onEditStart}
        className="flex flex-col items-center gap-1 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-xs text-muted-foreground">Rename</span>
      </button>
      <button
        onClick={onAddMember}
        className="flex flex-col items-center gap-1 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <UserPlus className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-xs text-muted-foreground">Add member</span>
      </button>
    </div>
  </div>
);
