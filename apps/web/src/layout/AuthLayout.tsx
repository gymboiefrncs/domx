import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

export const AuthLayout = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
};
