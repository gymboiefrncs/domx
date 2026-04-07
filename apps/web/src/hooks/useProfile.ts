import { deleteAccount } from "@/services/profile";
import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useDeleteAccount = () => {
  const [loadingDeleteAccount, setLoadingDeleteAccount] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async (): Promise<void> => {
    setLoadingDeleteAccount(true);
    try {
      await deleteAccount();
      toast.success("Account deleted");
      navigate("/signup", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingDeleteAccount(false);
    }
  };

  return { loadingDeleteAccount, handleDeleteAccount };
};
