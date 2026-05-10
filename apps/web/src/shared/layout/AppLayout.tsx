import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Nav } from "@/shared/components/Nav";

export const AppLayout = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="app-shell">
      <Nav />
      <div className="main-pane">
        {/* Prefer explicit children when provided; fallback to TanStack Outlet. */}
        {children ?? <Outlet />}
      </div>
    </div>
  );
};
