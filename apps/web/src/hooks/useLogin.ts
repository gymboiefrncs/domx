import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/services/login";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleLogin(email: string, password: string) {
    setLoading(true);
    try {
      await login(email, password);
      navigate("/groups", { replace: true });
    } catch (err) {
      // use any for now since we don't have a defined error type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message);
    } finally {
      setLoading(false);
    }
  }
  return { handleLogin, loading, error };
};
