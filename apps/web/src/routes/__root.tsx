import { NotFoundPage } from "@/pages/NotFoundPage";
import type { User } from "@domx/shared";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

export interface RouterContext {
  queryClient: QueryClient;
  auth: User | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  notFoundComponent: NotFoundPage,
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <Toaster position="top-right" />
      <Outlet />
    </>
  );
}
