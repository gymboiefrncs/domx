import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { Nav } from "@/shared/components/Nav";
import { meQueryOptions } from "@/features/profile/queries";
import { SocketListener } from "@/shared/components/SocketListeners";

function AuthenticatedLayout() {
  return (
    <div className="app-shell bg-background">
      <SocketListener />
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
