import { useState } from "react";
import { useModalStore } from "../../store/group.modal";
import { useCreateGroup } from "../../hooks/useGroup";
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

export const CreateGroupModal = () => {
  const { activeModalId, closeModal } = useModalStore();
  const [groupName, setGroupName] = useState("");
  const { mutate: createGroup, isPending } = useCreateGroup();

  if (activeModalId !== "create-group") return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    createGroup(groupName, {
      onSuccess: () => {
        setGroupName("");
        closeModal();
      },
    });
  };

  return (
    <Dialog open={activeModalId === "create-group"} onOpenChange={closeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Start a new group chat by giving it a name.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="group-name" className="mb-2">
              Group Name
            </Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isPending}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
