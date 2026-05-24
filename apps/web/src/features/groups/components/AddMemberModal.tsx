import { useState } from "react";
import { useModalStore } from "../store/group.modal";
import { socket } from "@/shared/lib/socket/socket.client";
import { useParams } from "@tanstack/react-router";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 relative animate-fade-in">
        <button
          className="absolute top-4 right-4 text-black/75 hover:text-gray-600 text-2xl"
          onClick={closeModal}
          aria-label="Close"
        >
          &times;
        </button>
        <h3 className="font-bold text-2xl mb-4 text-gray-800">Add Member</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="addMember"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Member Display ID
            </label>
            <input
              id="addMember"
              type="text"
              className="input input-bordered w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={displayId}
              onChange={(e) => setDisplayId(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
