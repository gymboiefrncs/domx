import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useGroupMembers, useGroups } from "@/features/groups/hooks/useGroup";
import { GroupChatHeader } from "@/features/posts/component/GroupChatHeader";
import { GroupChatMessages } from "@/features/posts/component/GroupChatMessages";
import { GroupChatInput } from "@/features/posts/component/GroupChatInput";
import { useMe } from "@/features/profile";

export const GroupChatPage = () => {
  const { id } = useParams({ from: "/_authenticated/groups/$id/chat" });
  const navigate = useNavigate();
  const { data: groups, isLoading } = useGroups();
  const { data: members } = useGroupMembers(id);
  const { data: me } = useMe();
  const group = groups?.find((g) => g.group_id === id);
  const member = members?.find((m) => m.display_id === me?.display_id);

  useEffect(() => {
    if (isLoading) return;
    if (!group) navigate({ to: "/groups" });
  }, [group, navigate]);

  if (!group) return null;

  return (
    <div className="flex flex-col h-full">
      <GroupChatHeader groupId={id} group={group} />
      <GroupChatMessages
        groupId={id}
        userId={me?.id}
        role={member?.role ?? "member"}
      />
      <GroupChatInput
        groupId={id}
        username={me?.username}
        displayId={me?.display_id}
        userId={me?.id}
      />
    </div>
  );
};
