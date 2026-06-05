import { createFileRoute } from "@tanstack/react-router";
import { GroupPage } from "@/pages/GroupPage";
import { groupsQueryOptions } from "@/features/groups/queries";
import { GroupPageSkeleton } from "@/features/groups/components/main-page/GroupPageSkeleton";

export const Route = createFileRoute("/_authenticated/groups/")({
  component: GroupPage,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(groupsQueryOptions),
  pendingComponent: GroupPageSkeleton,
});
