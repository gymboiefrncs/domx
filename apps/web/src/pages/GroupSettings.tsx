import { useGroups } from "@/context/GroupContext";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useUpdateNameGroup } from "@/hooks/useUpdateNameGroup";
import { AddMemberModal } from "@/components/AddMemberModal";
import type { NewMember } from "@domx/shared";
import { fetchGroupMembers } from "@/services/group";

export const GroupSettingsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { groups, loading, updateGroupName } = useGroups();
  const { handleUpdateName } = useUpdateNameGroup();
  const group = groups.find((g) => g.group_id === id);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(group?.name ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [modal, setModal] = useState<boolean>(false);
  const [members, setMembers] = useState<NewMember[]>([]);

  useEffect(() => {
    fetchGroupMembers(id!).then(setMembers);
  }, [id]);

  if (loading) return;

  // TODO: add 404 page
  if (!group) return <div>Group not found</div>;

  const handleStartEditing = () => {
    setNameValue(group.name);
    setIsEditingName(true);
  };

  const handleNameConfirm = async () => {
    await handleUpdateName(group.group_id, nameValue);
    updateGroupName(group.group_id, nameValue);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
  };

  return (
    <div className="h-full bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="text-text-muted hover:text-text transition-colors text-sm"
        >
          ←
        </button>
        <h1 className="text-sm font-semibold text-text tracking-wide uppercase">
          Group Settings
        </h1>
      </div>

      <div className="flex flex-col divide-y divide-border overflow-y-auto">
        {/* Group Name */}
        <section className="px-4 py-5">
          <p className="text-[12px] text-text-muted uppercase font-bold mb-3">
            Group Name
          </p>
          {isEditingName ? (
            <div className="flex px-3 items-center gap-2">
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameConfirm();
                  if (e.key === "Escape") handleNameCancel();
                }}
                className="flex-1 min-w-0 bg-transparent text-text text-base border-b border-primary outline-none py-1"
              />
              <button
                onClick={handleNameConfirm}
                className="text-primary text-sm font-medium hover:opacity-70 transition-opacity shrink-0"
              >
                Save
              </button>
              <button
                onClick={handleNameCancel}
                className="text-text-muted text-sm hover:opacity-70 transition-opacity shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEditing}
              className="flex items-center justify-between w-full group"
            >
              <span className="text-text px-3 text-base">{group.name}</span>
              <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                Edit
              </span>
            </button>
          )}
        </section>

        {/* Members */}
        <section className="px-4 py-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] text-text-muted uppercase font-bold">
              Members / {members.length}
            </p>
            <button
              className="text-xs text-primary bg-primary/10 p-2 rounded-lg font-medium hover:opacity-70 transition-opacity"
              onClick={() => setModal(true)}
            >
              + Add Member
            </button>
          </div>

          <ul className="flex flex-col gap-1">
            {members.map((member) => (
              <li
                key={member.display_id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-bg-subtle transition-colors"
              >
                <div className="flex gap-3 justify-start items-center w-full">
                  <div className="w-8 h-8 rounded-full bg-primary/70 flex items-center justify-center text-text text-md font-bold">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-text">{member.username}</span>
                    <span className="text-xs text-text-muted">
                      {member.display_id}
                    </span>
                  </div>
                  <span className="text-text-muted">•</span>
                  <span className="text-xs text-text-muted capitalize">
                    {member.role}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {modal && (
            <AddMemberModal
              onClose={() => setModal(false)}
              onSuccess={(newMember: NewMember) => {
                setModal(false);
                setMembers((prev) => [...prev, newMember]);
              }}
            />
          )}
        </section>
        {/* Danger Zone */}
        <section className="px-4 py-5">
          <p className="text-xs text-error font-semibold uppercase tracking-widest mb-3">
            Danger Zone
          </p>

          {showDeleteConfirm ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text">
                Are you sure? This can't be undone.
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                  onClick={() => {
                    // TODO: delete group
                  }}
                >
                  Yes, delete
                </button>
                <button
                  className="flex-1 py-2 text-sm text-text-muted border border-border rounded hover:bg-bg-subtle transition-colors"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-text-inverse bg-error py-2 px-1 w-full text-center rounded hover:opacity-70 transition-opacity"
            >
              Delete group
            </button>
          )}
        </section>
      </div>
    </div>
  );
};
