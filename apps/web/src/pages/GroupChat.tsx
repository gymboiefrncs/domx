import { Navigate, useParams } from "@tanstack/react-router";
import { Suspense, useEffect } from "react";
import {
  groupMembersQueryOptions,
  groupsQueryOptions,
} from "@/features/groups/queries";
import { GroupChatHeader } from "@/features/threads/component/GroupChatHeader";
import { GroupChatMessages } from "@/features/threads/component/GroupChatMessages";
import { GroupChatInput } from "@/features/threads/component/GroupChatInput";
import { socket } from "@/shared/lib/socket/socket.client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { meQueryOptions } from "@/features/profile/hooks/useProfile";
import { ChatMessagesSkeleton } from "@/features/threads/component/GroupMessagesSkeleton";

export const GroupChatPage = () => {
  const { id } = useParams({ from: "/_authenticated/groups/$id/chat" });
  const { data: groups } = useSuspenseQuery(groupsQueryOptions);
  const { data: members } = useSuspenseQuery(groupMembersQueryOptions(id));
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const group = groups.find((g) => g.group_id === id);
  const member = members.find((m) => m.display_id === me.display_id)!;

  useEffect(() => {
    socket.emit("group:seen", id);
  }, [id]);

  if (!group) return <Navigate to="/groups" replace />;

  return (
    <div className="flex flex-col h-full">
      <GroupChatHeader groupId={id} group={group} />
      <Suspense fallback={<ChatMessagesSkeleton />}>
        <GroupChatMessages groupId={id} userId={me.id} role={member.role} />
      </Suspense>
      <GroupChatInput
        groupId={id}
        username={me.username}
        displayId={me.display_id}
        userId={me.id}
      />
    </div>
  );
};
