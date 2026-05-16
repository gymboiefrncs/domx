import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import {
  login,
  logout,
  resendOTP,
  setInfo,
  signup,
  verifyOTP,
} from "../transport/auth.api";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import type {
  LoginState,
  ResendOTPState,
  SetInfoState,
  SignupState,
  VerifyOTPState,
} from "../types";

export const useLogin = (): LoginState => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const { mutate: handleLogin, isPending: loading } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: async () => {
      toast.success("Logged in successfully", { duration: 2000 });
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      router.invalidate();
      navigate({ to: "/groups", replace: true });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
  return { handleLogin, loading };
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  const { mutate: handleLogout, isPending: loadingLogout } = useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.clear(),
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
  return { handleLogout, loadingLogout };
};

export const useSignup = (): SignupState => {
  const navigate = useNavigate();

  const { mutate: handleSignup, isPending: loading } = useMutation({
    mutationFn: (email: string) => signup(email),
    onSuccess: (result, email) => {
      if (result === "INCOMPLETE_SIGNUP") {
        navigate({ to: "/setup-profile", replace: true });
        return;
      }
      sessionStorage.setItem("OTP_EMAIL", email);
      navigate({ to: "/otp", replace: true });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  return { handleSignup, loading };
};

export const useResendOTP = (): ResendOTPState => {
  const { mutate: handleResendOTP, isPending: loading } = useMutation({
    mutationFn: (email: string) => resendOTP(email),
    onSuccess: (message) => toast.success(message),
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  return { handleResendOTP, loading };
};

export const useVerifyOTP = (): VerifyOTPState => {
  const navigate = useNavigate();
  const { mutate: handleVerifyOTP, isPending: loading } = useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      verifyOTP(email, otp),
    onSuccess: (message) => {
      toast.success(message);
      navigate({ to: "/setup-profile", replace: true });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  return { handleVerifyOTP, loading };
};

export const useSetInfo = (): SetInfoState => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const { mutate: handleSetInfo, isPending: loading } = useMutation({
    mutationFn: ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => setInfo(username, password),
    onSuccess: async () => {
      toast.success("Welcome!");
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      router.invalidate();
      navigate({ to: "/groups", replace: true });
      sessionStorage.removeItem("OTP_EMAIL");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  return { handleSetInfo, loading };
};
