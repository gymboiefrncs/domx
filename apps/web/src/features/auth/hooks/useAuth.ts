import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
  const [loading, setLoading] = useState<boolean>(false);
  // Use TanStack navigation after router migration.
  const navigate = useNavigate();

  const handleLogin = async (
    email: string,
    password: string,
  ): Promise<void> => {
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Logged in successfully!", { duration: 2000 });
      navigate({ to: "/authenticated/groups", replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err), { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };
  return { handleLogin, loading };
};

export const useLogout = () => {
  const [loadingLogout, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return { loadingLogout, handleLogout };
};

export const useSignup = (): SignupState => {
  const [loading, setLoading] = useState<boolean>(false);
  // Use TanStack navigation after router migration.
  const navigate = useNavigate();

  const handleSignup = async (email: string): Promise<void> => {
    setLoading(true);
    try {
      const result = await signup(email);
      if (result && result.message === "INCOMPLETE_SIGNUP") {
        navigate({ to: "/setup-profile", replace: true });
        return;
      }
      /**
       * Used sessionStorage instead of state for the email to survive in otp page refreshed
       * This prevents users having to restart the signup flow if they accidentally
       * refresh the page during OTP verification step
       */
      sessionStorage.setItem("OTP_EMAIL", email);
      navigate({ to: "/otp", replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  return { handleSignup, loading };
};

export const useResendOTP = (): ResendOTPState => {
  const [loading, setLoading] = useState<boolean>(false);

  const handleResendOTP = async (email: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await resendOTP(email);
      toast.success(
        (response && response.message) || "OTP resent successfully",
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleResendOTP };
};

export const useVerifyOTP = (): VerifyOTPState => {
  const [loading, setLoading] = useState<boolean>(false);
  // Use TanStack navigation after router migration.
  const navigate = useNavigate();

  const handleVerifyOTP = async (email: string, otp: string): Promise<void> => {
    const toastId = toast.loading("Verifying OTP...");
    setLoading(true);

    try {
      await verifyOTP(email, otp);
      toast.success("OTP verified successfully!", { id: toastId });
      navigate({ to: "/setup-profile", replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err), { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  return { handleVerifyOTP, loading };
};

export const useSetInfo = (): SetInfoState => {
  const [loading, setLoading] = useState<boolean>(false);
  // Use TanStack navigation after router migration.
  const navigate = useNavigate();

  const handleSetInfo = async (
    username: string,
    password: string,
  ): Promise<void> => {
    const toastId = toast.loading("Setting up your profile...");
    setLoading(true);
    try {
      await setInfo(username, password);
      toast.success("Welcome!", { id: toastId });
      navigate({ to: "/authenticated/groups", replace: true });
      sessionStorage.removeItem("OTP_EMAIL");
    } catch (err) {
      toast.error(getErrorMessage(err), { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  return { handleSetInfo, loading };
};
