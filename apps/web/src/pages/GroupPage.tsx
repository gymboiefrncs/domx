import { GroupCard } from "../components/GroupCard";
import { useState } from "react";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { useNavigate } from "react-router-dom";
import { SpinnerIcon } from "@/assets/icons";
import type { GroupDetail } from "@domx/shared";
import { useLogout } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";

export const GroupPage = () => {
  const { groups, loading } = useGroups();
  const { loadingLogout, handleLogout } = useLogout();
  const [modal, setModal] = useState<boolean>(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-neutral-400">
        <SpinnerIcon className="h-4 w-4 spinner" />
      </div>
    );
  }

  if (loadingLogout) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-neutral-400">
        <SpinnerIcon className="h-4 w-4 spinner" />
      </div>
    );
  }

  return (
    <div className="page-shell bg-neutral-50">
      <div className="page-content max-w-5xl">
        <div className="mb-6 flex items-center justify-between md:mb-8">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl xl:text-4xl">
              My Groups
            </h1>
            <p className="mt-1 text-xs text-neutral-400 md:text-sm">
              {groups.length > 0 ? groups.length : "No"} group
              {groups.length !== 1 && "s"}
            </p>
          </div>
          <button
            className="rounded-md bg-error px-4 py-2 text-xs text-white md:text-sm"
            onClick={async () => {
              await handleLogout();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3 xl:grid-cols-3">
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
        className="btn btn-primary fixed bottom-20 right-4 md:bottom-6 md:right-8 xl:right-12"
        onClick={() => setModal(true)}
      >
        Create Group
      </button>
      {modal && <CreateGroupModal onClose={(): void => setModal(false)} />}
    </div>
  );
};
