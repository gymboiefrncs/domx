import React, { useState } from "react";
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

interface GroupFormProps {
  onSubmit: (groupName: string) => void;
  isPending: boolean;
}
const GroupForm = ({ onSubmit, isPending }: GroupFormProps) => {
  const [groupName, setGroupName] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(groupName);
  };
  return (
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
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
};

export const CreateGroupModal = () => {
  const { activeModalId, closeModal } = useModalStore();
  const { mutate: createGroup, isPending } = useCreateGroup();

  if (activeModalId !== "create-group") return null;

  const handleCreate = (groupName: string) => {
    createGroup(groupName, {
      onSuccess: () => closeModal(),
    });
  };

  return (
    <Dialog open={activeModalId === "create-group"} onOpenChange={closeModal}>
      <DialogContent>
        {/* 🟢 The Header, Title, and Description never rerender when typing now */}
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Start a new group chat by giving it a name.
        </DialogDescription>

        <GroupForm onSubmit={handleCreate} isPending={isPending} />
      </DialogContent>
    </Dialog>
  );
};
