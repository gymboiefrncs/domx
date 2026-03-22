import { useState } from "react";
import { useCreateGroup } from "@/hooks/useCreateGroup";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export const CreateGroupModal = ({ onClose, onSuccess }: Props) => {
  const [name, setName] = useState("");
  const { handleCreate, loading } = useCreateGroup(onSuccess);

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
            className={"input"}
            placeholder="e.g. Study Group"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
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
