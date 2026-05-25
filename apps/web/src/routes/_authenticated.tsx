import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { Nav } from "@/shared/components/Nav";
import { meQueryOptions } from "@/features/profile/hooks/useProfile";
import { useEffect } from "react";
import { socket } from "@/shared/lib/socket/socket.client";
import { useGroupSocketEvents } from "@/features/groups/hooks/useGroupSocketEvents";

function AuthenticatedLayout() {
  useGroupSocketEvents();
  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  return (
    <div className="app-shell bg-background">
      <Nav />
      <div className="main-pane">
        <Outlet />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    try {
      const user = await context.queryClient.ensureQueryData(meQueryOptions);

      if (!user) {
        throw redirect({ to: "/login", search: { redirect: location.href } });
      }
      return { auth: user };
    } catch {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  staleTime: Infinity,
  component: AuthenticatedLayout,
});
