import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  login,
  logout,
  resendOTP,
  setInfo,
  signup,
  verifyOTP,
} from "../api/auth.api";
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
  const navigate = useNavigate();

  const { mutate: handleLogin, isPending: loading } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: () => {
      toast.success("Logged in successfully", { duration: 2000 });
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
  const navigate = useNavigate();

  const { mutate: handleLogout, isPending: loadingLogout } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate({ to: "/login", replace: true });
    },
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
      // store email in session to be used in OTP verification step
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
  const navigate = useNavigate();

  const { mutate: handleSetInfo, isPending: loading } = useMutation({
    mutationFn: ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => setInfo(username, password),
    onSuccess: () => {
      toast.success("Welcome!");
      navigate({ to: "/groups", replace: true });
      sessionStorage.removeItem("OTP_EMAIL");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  return { handleSetInfo, loading };
};
