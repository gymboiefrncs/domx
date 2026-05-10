import { NotFoundPage } from "@/pages/NotFoundPage";
import { createRootRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

export const Route = createRootRoute({
  beforeLoad: () => {
    if (location.pathname === "/") {
      throw redirect({ to: "/login" });
    }
  },
  notFoundComponent: NotFoundPage,
  component: () => (
    <>
      <Toaster position="top-right" />
      <Outlet />
    </>
  ),
});
