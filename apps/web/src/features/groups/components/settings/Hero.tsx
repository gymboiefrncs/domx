import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInitials } from "../main-page/GroupAvatar";
import { useState } from "react";
import { socket } from "@/shared/lib/socket/socket.client";
import type { GroupRole } from "@domx/shared";
import { useNavigate } from "@tanstack/react-router";
import { GroupActions } from "./GroupActions";

interface GroupRenameFormProps {
  name: string;
  groupId: string;
  setIsEditing: (isEditing: boolean) => void;
}

const GroupRenameForm = ({
  name,
  groupId,
  setIsEditing,
}: GroupRenameFormProps) => {
  const [editedName, setEditedName] = useState(name);

  const handleRename = (newName: string) => {
    if (!newName.trim()) return;
    socket.emit("group:rename", { groupId, newName });
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-xs">
      <Input
        value={editedName}
        onChange={(e) => setEditedName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleRename(editedName)}
        className="text-center"
        autoFocus
      />
      <Button size="sm" onClick={() => handleRename(editedName)}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
        Cancel
      </Button>
    </div>
  );
};

interface Props {
  name: string;
  role: GroupRole;
  groupId: string;
  onAddMember: () => void;
}

export const GroupHero = ({ name, role, groupId, onAddMember }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const handleDelete = () => {
    socket.emit("group:delete", groupId);
    navigate({ to: "/groups" });
  };

  const handleLeave = () => {
    socket.emit("group:member:leave", groupId, (response) => {
      if (response.success) {
        navigate({ to: "/groups" });
      }
    });
  };

  const handleRename = () => {
    setIsEditing(true);
  };

  return (
    <div className="flex flex-col items-center gap-3 px-5">
      <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-2xl font-medium text-emerald-400 shrink-0">
        {getInitials(name)}
      </div>

      {isEditing ? (
        <GroupRenameForm
          name={name}
          groupId={groupId}
          setIsEditing={setIsEditing}
        />
      ) : (
        <p className="text-xl font-medium text-foreground">{name}</p>
      )}

      {/* Action Button Row */}
      <GroupActions
        role={role}
        onRename={handleRename}
        onAddMember={onAddMember}
        onLeave={handleLeave}
        onDelete={handleDelete}
      />
    </div>
  );
};
