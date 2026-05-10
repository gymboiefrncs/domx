import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/pages/Profile";

export const Route = createFileRoute("/authenticated/profile")({
  component: ProfilePage,
});
