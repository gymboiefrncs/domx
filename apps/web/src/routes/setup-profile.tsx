import { createFileRoute } from "@tanstack/react-router";
import SetupProfilePage from "@/pages/SetupProfile";

export const Route = createFileRoute("/setup-profile")({
  component: SetupProfilePage,
});
