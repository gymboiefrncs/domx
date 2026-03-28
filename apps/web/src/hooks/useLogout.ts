import { logout } from "@/services/logout";
import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { toast } from "sonner";

export const useLogout = () => {
  const [loadingLogout, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await logout();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return { loadingLogout, handleLogout };
};
