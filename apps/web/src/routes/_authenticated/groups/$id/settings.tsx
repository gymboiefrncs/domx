import { GroupSettingsPage } from "@/pages/GroupSettings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/groups/$id/settings")({
  component: GroupSettingsPage,
});
