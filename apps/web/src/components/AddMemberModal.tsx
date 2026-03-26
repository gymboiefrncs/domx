import { useState } from "react";
import type { AddMemberProps } from "@/shared";
import { useAddMember } from "@/hooks/useAddMember";
import { useParams } from "react-router-dom";

export const AddMemberModal = ({ onClose, onSuccess }: AddMemberProps) => {
  const { id } = useParams();
  const [displayId, setDisplayId] = useState<string>("");
  const { handleAddMember, loading } = useAddMember(onSuccess);

  if (!id) return;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-modal"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm mx-4 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-medium text-text">Add a member</h2>

        <div className="field">
          <label className="field-label">Display Id</label>
          <input
            className={"input"}
            placeholder="e.g. 1d24a3"
            value={displayId}
            onChange={(e) => setDisplayId(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={(): Promise<void> => handleAddMember(id, displayId)}
            disabled={!displayId.trim() || loading}
          >
            {loading ? "Adding..." : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
};
