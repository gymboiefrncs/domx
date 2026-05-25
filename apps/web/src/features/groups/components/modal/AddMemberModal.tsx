import { useState } from "react";
import { useModalStore } from "../../store/group.modal";
import { socket } from "@/shared/lib/socket/socket.client";
import { useParams } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const AddMemberModal = () => {
  const { activeModalId, closeModal } = useModalStore();
  const [displayId, setDisplayId] = useState("");
  const { id } = useParams({ from: "/_authenticated/groups/$id/settings" });

  if (activeModalId !== "add-member") return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayId.trim()) return;
    socket.emit("group:member:add", {
      groupId: id,
      targetUserDisplayId: displayId,
    });
    setDisplayId("");
    closeModal();
  };

  return (
    <Dialog open={activeModalId === "add-member"} onOpenChange={closeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="display-id" className="mb-2">
              Display ID
            </Label>
            <Input
              id="display-id"
              value={displayId}
              onChange={(e) => setDisplayId(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
