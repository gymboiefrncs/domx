import { AppLayout } from "@/shared/layout/AppLayout";
import { AuthLayout } from "@/shared/layout/AuthLayout";
import { GroupProvider } from "@/providers/GroupContext";
import { fetchProfile } from "@/features/profile";
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // iff fetchProfile fails, it means the user is not  authenticated, so redirect them to lohin page
    try {
      await fetchProfile();
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AuthLayout>
      <AppLayout>
        <GroupProvider>
          <Outlet />
        </GroupProvider>
      </AppLayout>
    </AuthLayout>
  ),
});
