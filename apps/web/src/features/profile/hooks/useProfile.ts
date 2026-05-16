import { deleteAccount, fetchProfile } from "../transport/rest/profile.api";
import { getErrorMessage } from "@/shared/lib/errors";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useMe = () => {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: fetchProfile,
    staleTime: Infinity,
  });
};

export const useDeleteAccount = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: handleDeleteAccount, isPending: loadingDeleteAccount } =
    useMutation({
      mutationFn: deleteAccount,
      onSuccess: () => {
        toast.success("Account deleted");
        queryClient.clear();
        navigate({ to: "/signup", replace: true });
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });

  return { loadingDeleteAccount, handleDeleteAccount };
};
