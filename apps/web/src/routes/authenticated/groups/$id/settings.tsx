import { createFileRoute } from "@tanstack/react-router";
import { GroupSettingsPage } from "@/pages/GroupSettings";

export const Route = createFileRoute("/authenticated/groups/$id/settings")({
  component: GroupSettingsPage,
});
