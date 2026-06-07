import { GroupSettingsSkeleton } from "@/features/groups/components/settings/GroupSettingSkeleton";
import {
  groupMembersQueryOptions,
  groupsQueryOptions,
} from "@/features/groups/queries";
import { meQueryOptions } from "@/features/profile/queries";
import { GroupSettingsPage } from "@/pages/GroupSettings";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/groups/$id/settings")({
  component: GroupSettingsPage,
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
  pendingComponent: GroupSettingsSkeleton,
});
