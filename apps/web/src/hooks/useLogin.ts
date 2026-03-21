import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/services/login";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(email: string, password: string) {
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
