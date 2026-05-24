import { useGroupMembers } from "@/features/groups/hooks/useGroup";
import { useParams } from "@tanstack/react-router";

export const GroupSettingsPage = () => {
  const { id } = useParams({ from: "/_authenticated/groups/$id/settings" });
  console.log("group id: ", id);
  const { data: members, isLoading, isError } = useGroupMembers(id);
  if (isLoading) return <p>Loading members...</p>;
  if (isError) return <p>Error loading members.</p>;
  return (
    <div>
      <h1>Group Settings</h1>
      {/* TODO: add design */}
      <p>Members:</p>
      <ul>
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
      <p></p>
    </div>
  );
};
