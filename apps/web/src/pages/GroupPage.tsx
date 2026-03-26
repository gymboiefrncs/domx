import { GroupCard } from "../components/GroupCard";
import { useState } from "react";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { useGroups } from "@/context/GroupContext";
import { useNavigate } from "react-router-dom";
import { SpinnerIcon } from "@/assets/icons";
import type { GroupDetail } from "@domx/shared";

export const GroupPage = () => {
  const { groups, loading, loadGroups } = useGroups();
  const [modal, setModal] = useState<boolean>(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-neutral-400">
        <SpinnerIcon className="h-4 w-4 spinner" />
      </div>
    );
  }

  return (
    <div className="h-full bg-neutral-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-neutral-900 tracking-tight">
              My Groups
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              {groups.length > 0 ? groups.length : "No"} group
              {groups.length !== 1 && "s"}
            </p>
          </div>
          <button
            className="bg-error py-2 px-4 rounded-md text-xs text-white"
            onClick={() => {
              // TODO: add logout
            }}
          >
            Log out
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {groups.map((group: GroupDetail) => (
            <GroupCard
              key={group.group_id}
              group={group}
              onClick={(id) => navigate(`/groups/${id}`)}
            />
          ))}
        </div>
      </div>
      <button
        className="btn btn-primary fixed bottom-20 right-4"
        onClick={() => setModal(true)}
      >
        Create Group
      </button>
      {modal && (
        <CreateGroupModal
          onClose={(): void => setModal(false)}
          onSuccess={(): void => {
            loadGroups();
            setModal(false);
          }}
        />
      )}
    </div>
  );
};
