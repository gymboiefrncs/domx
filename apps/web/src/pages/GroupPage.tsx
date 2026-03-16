import { GroupCard } from "../components/GroupCard";
import type { Group } from "../components/GroupCard";
import { useState } from "react";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { useGroups } from "@/context/GroupContext";

export const GroupPage = () => {
  const { groups, loading, error } = useGroups();
  const [modal, setModal] = useState(false);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-neutral-400">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-red-400">
        Failed to load groups.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-neutral-900 tracking-tight">
              My Groups
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              {groups.length > 0 ? groups.length : "No"} groups
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {groups.map((group: Group) => (
            <GroupCard key={group.group_id} group={group} onClick={() => {}} />
          ))}
        </div>
      </div>
      <button
        className="btn btn-primary fixed bottom-20 right-4"
        onClick={() => setModal(true)}
      >
        Create Group
      </button>
      {modal && <CreateGroupModal onClose={() => setModal(false)} />}
    </div>
  );
};
