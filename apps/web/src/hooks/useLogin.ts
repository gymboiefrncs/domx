import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/services/login";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
import type { LoginState } from "@/shared";

export const useLogin = (): LoginState => {
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  async function handleLogin(email: string, password: string): Promise<void> {
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Logged in successfully!", { duration: 2000 });
      navigate("/groups", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  }
  return { handleLogin, loading };
};
