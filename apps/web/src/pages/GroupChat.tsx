import type { Group } from "@domx/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

export const GroupChatPage = () => {
  const { id } = useParams({ from: "/_authenticated/groups/$id" });
  const queryClient = useQueryClient();
  const group = queryClient
    .getQueryData<Group[]>(["groups"])
    ?.find((g) => g.group_id === id);

  return (
    <div>
      <h1>Group Chat</h1>
      <p>Welcome to the group chat!</p>
      <h1>{group?.name}</h1>
      <p>{group?.member_count} members</p>
    </div>
  );
};
