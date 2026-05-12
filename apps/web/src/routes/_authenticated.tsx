import { AuthProvider } from "@/providers/AuthContext";
import { GroupProvider } from "@/providers/GroupContext";
import { fetchProfile } from "@/features/profile";
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { Nav } from "@/shared/components/Nav";

export const Route = createFileRoute("/_authenticated")({
  loader: async () => {
    // If fetchProfile fails, the user is not authenticated; redirect to login.
    try {
      const user = await fetchProfile();
      return { user };
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: () => {
    const { user } = Route.useLoaderData();

    return (
      <AuthProvider initialUser={user}>
        <div className="app-shell">
          <Nav />
          <div className="main-pane">
            <GroupProvider>
              <Outlet />
            </GroupProvider>
          </div>
        </div>
      </AuthProvider>
    );
  },
});
