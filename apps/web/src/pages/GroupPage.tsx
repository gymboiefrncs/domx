import { useGroups } from "@/features/groups/hooks/useGroup";
import { useModalStore } from "@/features/groups/store/group.modal";
import { CreateGroupModal } from "@/features/groups/components/CreateGroupModal";
import { Link } from "@tanstack/react-router";

export const GroupPage = () => {
  const { data: groups, isLoading, isError } = useGroups();
  const openModal = useModalStore((state) => state.openModal);
  if (isLoading) return <p>Loading groups...</p>;
  if (isError) return <p>Error loading groups.</p>;
  return (
    <div>
      <h1>Group Page</h1>
      {/* TODO: add design */}
      {/* TODO: add group list */}

      {groups && groups.length > 0 ? (
        <ul>
          {groups.map((group) => (
            <li key={group.group_id}>
              <Link to={`/groups/$id/chat`} params={{ id: group.group_id }}>
                <p>group: {group.name}</p>
              </Link>
              <p>{group.member_count} members</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No groups found.</p>
      )}
      <button
        className="btn btn-primary"
        onClick={() => openModal("create-group")}
      >
        +
      </button>
      <CreateGroupModal />
    </div>
  );
};
