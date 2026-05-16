import {
  useParams,
  useNavigate,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import type { Member } from "@domx/shared";
import {
  fetchGroupMembers,
  AddMemberModal,
  useGroups,
} from "@/features/groups/index";
import { useMe } from "@/features/profile";
import { connectPostSocket, joinPostGroup } from "@/features/posts/index";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";

export const GroupSettingsPage = () => {
  // Read the route params from the TanStack route id.
  const { id } = useParams({ from: "/_authenticated/groups/$id/settings" });
  const navigate = useNavigate();
  const router = useRouter();
  const {
    groups,
    loading,
    renameGroup,
    removeGroup,
    promoteMember,
    demoteMember,
    kickMember,
    leaveGroup,
  } = useGroups();
  const { data: user } = useMe();
  const group = groups.find((g) => g.group_id === id);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(group?.name ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingKickDisplayId, setPendingKickDisplayId] = useState<
    string | null
  >(null);
  const [pendingPromoteDisplayId, setPendingPromoteDisplayId] = useState<
    string | null
  >(null);
  const [pendingDemoteDisplayId, setPendingDemoteDisplayId] = useState<
    string | null
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recentGroupDeletedEventsRef = useRef<Set<string>>(new Set());
  const [modal, setModal] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const currentMemberRole = members.find(
    (member) => member.display_id === user?.display_id,
  )?.role;
  const canManageMembers =
    currentMemberRole === "admin" ||
    (!currentMemberRole && group?.role === "admin");

  useEffect(() => {
    if (!id) return;

    fetchGroupMembers(id)
      .then(setMembers)
      .catch((error) => {
        toast.error(getErrorMessage(error));
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const disconnect = connectPostSocket({
      onOpen: () => {
        joinPostGroup(id);
      },
      onMessage: (message) => {
        if (!("type" in message)) return;
        if (message.type === "memberAdded") {
          if (message.data.group_id !== id) return;
          setMembers((prev) => {
            if (
              prev.some(
                (member) => member.display_id === message.data.display_id,
              )
            ) {
              return prev;
            }

            return [...prev, message.data];
          });
          return;
        }

        if (message.type === "memberPromoted") {
          if (message.data.groupId !== id) return;
          setMembers((prev) =>
            prev.map((member) =>
              member.display_id === message.data.displayId
                ? { ...member, role: "admin" }
                : member,
            ),
          );
          return;
        }

        if (message.type === "memberDemoted") {
          if (message.data.groupId !== id) return;
          setMembers((prev) =>
            prev.map((member) =>
              member.display_id === message.data.displayId
                ? { ...member, role: "member" }
                : member,
            ),
          );
          return;
        }

        if (message.type === "memberKicked") {
          if (message.data.groupId !== id) return;
          setMembers((prev) =>
            prev.filter(
              (member) => member.display_id !== message.data.displayId,
            ),
          );
          return;
        }

        if (message.type === "groupLeft") {
          if (message.data.groupId !== id) return;

          if (message.data.displayId) {
            setMembers((prev) =>
              prev.filter(
                (member) => member.display_id !== message.data.displayId,
              ),
            );
            return;
          }

          void fetchGroupMembers(id)
            .then(setMembers)
            .catch((error) => {
              toast.error(getErrorMessage(error));
            });
          return;
        }

        if (message.type === "groupDeleted") {
          if (message.data.groupId !== id) return;

          if (recentGroupDeletedEventsRef.current.has(message.data.groupId)) {
            return;
          }

          recentGroupDeletedEventsRef.current.add(message.data.groupId);
          window.setTimeout(() => {
            recentGroupDeletedEventsRef.current.delete(message.data.groupId);
          }, 5000);

          navigate({ to: "/groups", replace: true });
          toast.error(message.message ?? "Group deleted", {
            id: `group-deleted-${message.data.groupId}`,
          });
        }
      },
    });

    return () => {
      disconnect();
    };
  }, [id]);

  if (loading) return;

  if (!group)
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-bg rounded-2xl border border-dashed border-slate-200">
        <h3 className="text-xl font-bold text-text">Group Not Found</h3>
        <p className="text-text-muted mb-6 max-w-sm text-center">
          This group may have been deleted, or you might not have permission to
          view it.
        </p>
        <Link
          to="/groups"
          className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Browse other groups
        </Link>
      </div>
    );

  const handleStartEditing = () => {
    setNameValue(group.name);
    setIsEditingName(true);
  };

  const handleNameConfirm = async () => {
    await renameGroup(group.group_id, nameValue);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
  };

  const handleDeleteGroupCB = async (groupId: string) => {
    const removed = await removeGroup(groupId);
    if (!removed) return;
    setDeleteConfirmText("");
    navigate({ to: "/groups" });
  };

  const handlePromoteMember = async (displayId: string) => {
    if (!id) return;
    if (!canManageMembers) {
      toast.error("Only admins can promote members");
      return;
    }
    const promoted = await promoteMember(id, displayId);
    if (!promoted) return;

    setPendingPromoteDisplayId(null);

    setMembers((prev) =>
      prev.map((member) =>
        member.display_id === displayId ? { ...member, role: "admin" } : member,
      ),
    );
  };

  const handleDemoteMember = async (displayId: string) => {
    if (!id) return;
    if (!canManageMembers) {
      toast.error("Only admins can demote members");
      return;
    }
    const demoted = await demoteMember(id, displayId);
    if (!demoted) return;

    setPendingDemoteDisplayId(null);

    setMembers((prev) =>
      prev.map((member) =>
        member.display_id === displayId
          ? { ...member, role: "member" }
          : member,
      ),
    );
  };

  const handleKickMember = async (displayId: string) => {
    if (!id) return;
    if (!canManageMembers) {
      toast.error("Only admins can remove members");
      return;
    }
    const removed = await kickMember(id, displayId);
    if (!removed) return;

    setPendingKickDisplayId(null);
    setMembers((prev) =>
      prev.filter((member) => member.display_id !== displayId),
    );
  };

  const handleLeaveGroupCB = async () => {
    if (!id) return;
    const left = await leaveGroup(id);
    if (!left) return;
    navigate({ to: "/groups" });
  };

  const requestKickMember = (displayId: string) => {
    setPendingPromoteDisplayId(null);
    setPendingDemoteDisplayId(null);
    setPendingKickDisplayId(displayId);
  };

  const cancelKickMember = () => {
    setPendingKickDisplayId(null);
  };

  const requestPromoteMember = (displayId: string) => {
    setPendingKickDisplayId(null);
    setPendingDemoteDisplayId(null);
    setPendingPromoteDisplayId(displayId);
  };

  const cancelPromoteMember = () => {
    setPendingPromoteDisplayId(null);
  };

  const requestDemoteMember = (displayId: string) => {
    setPendingKickDisplayId(null);
    setPendingPromoteDisplayId(null);
    setPendingDemoteDisplayId(displayId);
  };

  const cancelDemoteMember = () => {
    setPendingDemoteDisplayId(null);
  };

  return (
    <div className="h-full bg-bg flex flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:px-6 lg:px-8">
        <button
          // TanStack doesn't support numeric navigation; use history.back().
          onClick={() => router.history.back()}
          className="text-text-muted hover:text-text transition-colors text-lg font-bold"
        >
          <span>{"↩"}</span>
        </button>
        <h1 className="text-sm font-semibold uppercase tracking-wide text-text md:text-base lg:text-lg">
          Group Settings
        </h1>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col divide-y divide-border overflow-y-auto">
        <section className="px-4 py-5 md:px-6 md:py-6 lg:px-8">
          <p className="mb-3 text-[12px] font-bold uppercase text-text-muted md:text-xs">
            Group Name
          </p>
          {canManageMembers && isEditingName ? (
            <div className="flex items-center gap-2 px-3">
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
                className="min-w-0 flex-1 border-b border-primary bg-transparent py-1 text-base text-text outline-none md:text-lg"
              />
              <button
                onClick={handleNameConfirm}
                className="shrink-0 text-sm font-medium text-primary transition-opacity hover:opacity-70 md:text-base"
              >
                Save
              </button>
              <button
                onClick={handleNameCancel}
                className="shrink-0 text-sm text-text-muted transition-opacity hover:opacity-70 md:text-base"
              >
                Cancel
              </button>
            </div>
          ) : canManageMembers ? (
            <button
              onClick={handleStartEditing}
              className="flex items-center justify-between w-full group"
            >
              <span className="px-3 text-base text-text md:text-lg">
                {group.name}
              </span>
              <span className="text-xs text-text-muted opacity-0 transition-opacity group-hover:opacity-100 md:text-sm">
                Edit
              </span>
            </button>
          ) : (
            <div className="px-3 text-base text-text md:text-lg">
              {group.name}
            </div>
          )}
        </section>

        <section className="px-4 py-5 md:px-6 md:py-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold uppercase text-text-muted md:text-xs">
              Members / {members.length}
            </p>
            <button
              className="rounded-lg bg-primary/10 p-2 text-xs font-medium text-primary transition-opacity hover:opacity-70 md:text-sm"
              onClick={() => setModal(true)}
            >
              + Add Member
            </button>
          </div>

          <ul className="flex flex-col gap-1">
            {members.map((member) => (
              <li
                key={member.display_id}
                className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-bg-subtle"
              >
                <div className="flex gap-3 justify-start items-center w-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/70 text-md font-bold text-text md:h-9 md:w-9">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-text md:text-sm">
                      {member.username}
                    </span>
                    <span className="text-xs text-text-muted md:text-sm">
                      {member.display_id}
                    </span>
                  </div>
                  <span className="text-text-muted">•</span>
                  <span className="text-xs capitalize text-text-muted md:text-sm">
                    {member.role}
                  </span>

                  {canManageMembers && (
                    <div className="ml-auto flex items-center gap-2">
                      {pendingPromoteDisplayId === member.display_id ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void handlePromoteMember(member.display_id)
                            }
                            className="rounded-md border border-primary/30 px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
                          >
                            Confirm Promote
                          </button>
                          <button
                            type="button"
                            onClick={cancelPromoteMember}
                            className="rounded-md border border-border px-2 py-1 text-xs text-text transition-colors hover:bg-bg-subtle"
                          >
                            Cancel
                          </button>
                        </>
                      ) : pendingDemoteDisplayId === member.display_id ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void handleDemoteMember(member.display_id)
                            }
                            className="rounded-md border border-primary/30 px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
                          >
                            Confirm Demote
                          </button>
                          <button
                            type="button"
                            onClick={cancelDemoteMember}
                            className="rounded-md border border-border px-2 py-1 text-xs text-text transition-colors hover:bg-bg-subtle"
                          >
                            Cancel
                          </button>
                        </>
                      ) : member.display_id === user?.display_id ? (
                        member.role === "admin" ? (
                          <button
                            type="button"
                            onClick={() =>
                              requestDemoteMember(member.display_id)
                            }
                            className="rounded-md border border-border px-2 py-1 text-xs text-text transition-colors hover:bg-bg-subtle"
                          >
                            Demote
                          </button>
                        ) : null
                      ) : pendingKickDisplayId === member.display_id ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void handleKickMember(member.display_id)
                            }
                            className="rounded-md border border-error/30 px-2 py-1 text-xs text-error transition-colors hover:bg-error/10"
                          >
                            Confirm Kick
                          </button>
                          <button
                            type="button"
                            onClick={cancelKickMember}
                            className="rounded-md border border-border px-2 py-1 text-xs text-text transition-colors hover:bg-bg-subtle"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {member.role === "member" ? (
                            <button
                              type="button"
                              onClick={() =>
                                requestPromoteMember(member.display_id)
                              }
                              className="rounded-md border border-primary/30 px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
                            >
                              Promote
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                requestDemoteMember(member.display_id)
                              }
                              className="rounded-md border border-border px-2 py-1 text-xs text-text transition-colors hover:bg-bg-subtle"
                            >
                              Demote
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => requestKickMember(member.display_id)}
                            className="rounded-md border border-error/30 px-2 py-1 text-xs text-error transition-colors hover:bg-error/10"
                          >
                            Kick
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {modal && (
            <AddMemberModal
              onClose={() => setModal(false)}
              onSuccess={(newMember: Member) => {
                setModal(false);
                setMembers((prev) => {
                  if (
                    prev.some(
                      (member) => member.display_id === newMember.display_id,
                    )
                  ) {
                    return prev;
                  }

                  return [...prev, newMember];
                });
              }}
            />
          )}
        </section>

        <section className="px-4 py-5 md:px-6 md:py-6 lg:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-error md:text-sm">
            Danger Zone
          </p>

          {showLeaveConfirm ? (
            <div className="mb-3 flex flex-col gap-3">
              <p className="text-sm text-text md:text-base">
                Leave this group?
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 text-sm font-medium text-text bg-bg-subtle border border-border rounded hover:bg-bg transition-colors"
                  onClick={() => void handleLeaveGroupCB()}
                >
                  Yes, leave
                </button>
                <button
                  className="flex-1 py-2 text-sm text-text-muted border border-border rounded hover:bg-bg-subtle transition-colors"
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="mb-3 text-sm text-text bg-bg-subtle py-2 px-1 w-full text-center rounded border border-border hover:bg-bg transition-colors"
            >
              Leave group
            </button>
          )}

          {canManageMembers && showDeleteConfirm ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-error md:text-base">
                Warning: This will permanently delete the group for all members.
              </p>
              <p className="text-sm text-text md:text-base">
                This action cannot be undone. Type DELETE to confirm.
              </p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full rounded border border-error/30 bg-bg px-3 py-2 text-sm text-text outline-none"
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deleteConfirmText.trim() !== "DELETE"}
                  onClick={() => {
                    void handleDeleteGroupCB(group.group_id);
                  }}
                >
                  Yes, delete
                </button>
                <button
                  className="flex-1 py-2 text-sm text-text-muted border border-border rounded hover:bg-bg-subtle transition-colors"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : canManageMembers ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-text-inverse bg-error py-2 px-1 w-full text-center rounded hover:opacity-70 transition-opacity"
            >
              Delete group
            </button>
          ) : null}
        </section>
      </div>
    </div>
  );
};
