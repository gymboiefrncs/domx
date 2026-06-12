import React, { useState } from "react";
import { useModalStore } from "../../store/group.modal";
import { socket } from "@/shared/lib/socket/socket.client";
import { useParams } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddMemberFormProps {
  onSubmit: (displayId: string) => void;
  onCancel: () => void;
}

const AddMemberForm = ({ onSubmit, onCancel }: AddMemberFormProps) => {
  const [displayId, setDisplayId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayId.trim()) return;
    onSubmit(displayId);
    setDisplayId("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="display-id" className="mb-2">
          Display ID
        </Label>
        <Input
          id="display-id"
          value={displayId}
          onChange={(e) => setDisplayId(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        {/* 💡 Extra touch: Disable button if empty spaces are typed */}
        <Button type="submit" disabled={!displayId.trim()}>
          Add
        </Button>
      </div>
    </form>
  );
};

export const AddMemberModal = () => {
  const { activeModalId, closeModal } = useModalStore();
  const { id } = useParams({ from: "/_authenticated/groups/$id/settings" });

  if (activeModalId !== "add-member") return null;

  const handleAddMember = (displayId: string) => {
    socket.emit("group:member:add", {
      groupId: id,
      targetUserDisplayId: displayId,
    });
    closeModal();
  };

  return (
    <Dialog open={activeModalId === "add-member"} onOpenChange={closeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Invite a new member to join this group by using their Display ID.
        </DialogDescription>

        <AddMemberForm onSubmit={handleAddMember} onCancel={closeModal} />
      </DialogContent>
    </Dialog>
  );
};
