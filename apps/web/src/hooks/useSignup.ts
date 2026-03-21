import { setInfo, signup, verifyOTP } from "@/services/signup";
import type { SetInfoState, SignupState, VerifyOTPState } from "@/shared";
import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useSignup = (): SignupState => {
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  async function handleSignup(email: string): Promise<void> {
    setLoading(true);
    try {
      const result = (await signup(email)) as {
        success: boolean;
        message: string;
      };
      if (result.success && result.message === "INCOMPLETE_SIGNUP") {
        navigate("/setup-profile", { replace: true });
        return;
      }
      /**
       * Used sessionStorage instead of state for the email to survive in otp page refreshed
       * This prevents users having to restart the signup flow if they accidentally
       * refresh the page during OTP verification step
       */
      sessionStorage.setItem("OTP_EMAIL", email);
      navigate("/otp", { replace: true });
      sessionStorage.setItem("OTP_EMAIL", email);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  return { handleSignup, loading };
};

export const useVerifyOTP = (): VerifyOTPState => {
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleVerifyOTP = async (email: string, otp: string) => {
    const toastId = toast.loading("Verifying OTP...");
    setLoading(true);

    try {
      await verifyOTP(email, otp);
      toast.success("OTP verified successfully!", { id: toastId });
      navigate("/setup-profile", { replace: true });
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
  const navigate = useNavigate();

  const handleSetInfo = async (username: string, password: string) => {
    const toastId = toast.loading("Setting up your profile...");
    setLoading(true);
    try {
      await setInfo(username, password);
      toast.success("Welcome!", { id: toastId });
      navigate("/groups", { replace: true });
      sessionStorage.removeItem("OTP_EMAIL");
    } catch (err) {
      toast.error(getErrorMessage(err), { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  return { handleSetInfo, loading };
};
