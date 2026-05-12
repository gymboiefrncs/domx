import { createContext, useContext } from "react";
import type { User } from "@domx/shared";

type AuthContextType = {
  user: User | null;
};
const AuthContext = createContext<AuthContextType | null>(null);
export const AuthProvider = ({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) => {
  return (
    <AuthContext.Provider value={{ user: initialUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
