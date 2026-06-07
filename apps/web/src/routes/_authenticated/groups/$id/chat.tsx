import {
  groupMembersQueryOptions,
  groupsQueryOptions,
} from "@/features/groups/queries";
import { GroupChatSkeleton } from "@/features/threads/component/GroupChatPageSkeleton";
import { meQueryOptions } from "@/features/profile/hooks/useProfile";
import { GroupChatPage } from "@/pages/GroupChat";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/groups/$id/chat")({
  component: GroupChatPage,
  loader: async ({ context: { queryClient }, params: { id } }) => {
    const [groups, members, me] = await Promise.all([
      queryClient.ensureQueryData(groupsQueryOptions),
      queryClient.ensureQueryData(groupMembersQueryOptions(id)),
      queryClient.ensureQueryData(meQueryOptions),
    ]);
    const group = groups.find((g) => g.group_id === id);
    const member = members.find((m) => m.display_id === me?.display_id);
    if (!group || !member) {
      throw redirect({ to: "/groups" });
    }
  },
  pendingComponent: GroupChatSkeleton,
});
