import { createFileRoute } from "@tanstack/react-router";
import { GroupPage } from "@/pages/GroupPage";

export const Route = createFileRoute("/_authenticated/groups/")({
  component: GroupPage,
});
