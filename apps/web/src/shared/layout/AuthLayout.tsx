import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthProvider } from "@/providers/AuthContext";

export const AuthLayout = ({ children }: { children?: ReactNode }) => {
  return (
    <AuthProvider>
      {/* Prefer explicit children when provided; fallback to TanStack Outlet. */}
      {children ?? <Outlet />}
    </AuthProvider>
  );
};
