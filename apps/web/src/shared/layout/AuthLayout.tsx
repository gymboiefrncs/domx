import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthContext";

export const AuthLayout = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
};
