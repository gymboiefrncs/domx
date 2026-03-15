import { setInfo, signup, verifyOTP } from "@/services/signup";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSignup(email: string) {
    setLoading(true);
    try {
      const result = await signup(email);
      if (result.success && result.message === "INCOMPLETE_SIGNUP") {
        navigate("/setup-profile", { replace: true });
        return;
      }
      navigate("/otp", { state: { email }, replace: true });
    } catch (err) {
      // use any for now since we don't have a defined error type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message);
      console.log("Failed to fetch groups", err);
    } finally {
      setLoading(false);
    }
  }
  return { handleSignup, loading, error };
};

export const useVerifyOTP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const handleVerifyOTP = async (email: string, otp: string) => {
    setLoading(true);
    try {
      await verifyOTP(email, otp);
      navigate("/setup-profile", { replace: true });
    } catch (err) {
      // use any for now since we don't have a defined error type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message);
      console.log("Failed to verify OTP", err);
    } finally {
      setLoading(false);
    }
  };
  return { handleVerifyOTP, loading, error };
};

export const useSetInfo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSetInfo = async (username: string, password: string) => {
    setLoading(true);
    try {
      await setInfo(username, password);
      navigate("/groups", { replace: true });
    } catch (err) {
      // use any for now since we don't have a defined error type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message);
      console.log("Failed to set info", err);
    } finally {
      setLoading(false);
    }
  };
  return { handleSetInfo, loading, error };
};
