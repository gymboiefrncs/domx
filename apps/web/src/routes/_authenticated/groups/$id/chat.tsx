import { GroupChatPage } from "@/pages/GroupChat";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/groups/$id/chat")({
  component: GroupChatPage,
});
