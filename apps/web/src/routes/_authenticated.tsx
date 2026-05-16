import { GroupProvider } from "@/providers/GroupContext";
import { fetchProfile } from "@/features/profile";
import { queryClient } from "@/shared/lib/queryClient";
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { Nav } from "@/shared/components/Nav";

export const Route = createFileRoute("/_authenticated")({
  loader: async () => {
    // If fetchProfile fails, the user is not authenticated; redirect to login.
    try {
      await queryClient.ensureQueryData({
        queryKey: ["profile", "me"],
        queryFn: fetchProfile,
        staleTime: Infinity,
      });
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  staleTime: Infinity,
  component: () => {
    return (
      <div className="app-shell">
        <Nav />
        <div className="main-pane">
          <GroupProvider>
            <Outlet />
          </GroupProvider>
        </div>
      </div>
    );
  },
});
