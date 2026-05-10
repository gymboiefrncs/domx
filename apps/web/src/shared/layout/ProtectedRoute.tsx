import { SpinnerIcon } from "@/shared/assets/icons";
import { useAuthContext } from "@/providers/AuthContext";
import { Navigate, Outlet } from "@tanstack/react-router";

export const ProtectedRoute = () => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-neutral-400">
        <SpinnerIcon className="h-4 w-4 spinner" />
      </div>
    );
  }

  if (!user) {
    // Use TanStack's Navigate to redirect unauthenticated users.
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
