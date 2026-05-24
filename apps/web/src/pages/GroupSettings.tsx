import { AddMemberModal } from "@/features/groups/components/AddMemberModal";
import { useGroupMembers, useGroups } from "@/features/groups/hooks/useGroup";
import { useModalStore } from "@/features/groups/store/group.modal";
import { useParams } from "@tanstack/react-router";

export const GroupSettingsPage = () => {
  const { id } = useParams({ from: "/_authenticated/groups/$id/settings" });
  const { data } = useGroups();
  const openModal = useModalStore((state) => state.openModal);
  const { data: members, isLoading, isError } = useGroupMembers(id);
  if (isLoading) return <p>Loading members...</p>;
  if (isError) return <p>Error loading members.</p>;
  return (
    <div>
      <h1>Group Settings</h1>
      {/* TODO: add design */}
      <p>Members:</p>
      <ul>
        <p>member count</p>
        <p>
          {data?.find((group) => group.group_id === id)?.member_count}{" "}
          members{" "}
        </p>
        {members && members.length > 0 ? (
          members.map((member) => (
            <li key={member.display_id}>
              <p>{member.username}</p>
            </li>
          ))
        ) : (
          <p>No members found.</p>
        )}
      </ul>
      <button
        className="btn btn-primary"
        onClick={() => openModal("add-member")}
      >
        Add Member
      </button>
      <AddMemberModal />
    </div>
  );
};
