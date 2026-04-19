import { useState } from "react";
import type { CreateGroupModalProps } from "../types";
import { useGroups } from "../hooks/useGroups";

export const CreateGroupModal = ({ onClose }: CreateGroupModalProps) => {
  const [name, setName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { loading, buildGroup } = useGroups();

  const handleCreate = async (): Promise<void> => {
    if (!name.trim() || loading || isSubmitting) return;

    setIsSubmitting(true);
    const created = await buildGroup(name);
    setIsSubmitting(false);

    if (created) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && name.trim() && !loading) {
      e.preventDefault();
      void handleCreate();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-modal"
      onClick={onClose}
    >
      <div
        className="card mx-4 flex w-full max-w-sm flex-col gap-4 md:max-w-md lg:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-medium text-text md:text-lg">
          Create a group
        </h2>

        <div className="field">
          <label className="field-label">Group name</label>
          <input
            className={"input"}
            placeholder="e.g. Study Group"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={(): Promise<void> => handleCreate()}
            disabled={!name.trim() || loading || isSubmitting}
          >
            {loading || isSubmitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};
