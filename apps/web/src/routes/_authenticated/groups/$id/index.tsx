import { createFileRoute } from "@tanstack/react-router";
import { GroupChatPage } from "@/pages/GroupChat";

export const Route = createFileRoute("/_authenticated/groups/$id/")({
  component: GroupChatPage,
});
