import { useState } from "react";
import { useGroups } from "@/context/GroupContext";
import { useCreateGroup } from "@/hooks/useCreateGroup";

type Props = {
  onClose: () => void;
};

export const CreateGroupModal = ({ onClose }: Props) => {
  const [name, setName] = useState("");
  const { addGroup } = useGroups();
  const { handleCreate, loading, error } = useCreateGroup((newGroup) => {
    addGroup(newGroup);
    onClose();
  });

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-modal"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm mx-4 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-medium text-text">Create a group</h2>

        <div className="field">
          <label className="field-label">Group name</label>
          <input
            className={`input ${error ? "input--error" : ""}`}
            placeholder="e.g. Study Group"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {error && <p className="text-error text-xs">{error}</p>}
        </div>

        <div className="flex gap-2 justify-end">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleCreate(name)}
            disabled={!name.trim() || loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};
