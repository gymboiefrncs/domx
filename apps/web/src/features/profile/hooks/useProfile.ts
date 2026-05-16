import { deleteAccount, fetchProfile } from "../transport/rest/profile.api";
import { getErrorMessage } from "@/shared/lib/errors";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export const useMe = () => {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: fetchProfile,
    staleTime: Infinity,
  });
};

export const useDeleteAccount = () => {
  const [loadingDeleteAccount, setLoadingDeleteAccount] = useState(false);
  // Use TanStack navigation after router migration.
  const navigate = useNavigate();

  const handleDeleteAccount = async (): Promise<void> => {
    setLoadingDeleteAccount(true);
    try {
      await deleteAccount();
      toast.success("Account deleted");
      navigate({ to: "/signup", replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingDeleteAccount(false);
    }
  };

  return { loadingDeleteAccount, handleDeleteAccount };
};
