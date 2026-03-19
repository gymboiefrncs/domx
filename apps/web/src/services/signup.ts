import { postJSON } from "@/lib/postJSON";
import type { serviceResponse } from "@/shared";

export const signup = (email: string): Promise<serviceResponse> =>
  postJSON("/auth/signup", { email });

export const verifyOTP = (
  email: string,
  otp: string,
): Promise<serviceResponse> => postJSON("/verify-email", { email, otp });

export const setInfo = (
  username: string,
  password: string,
): Promise<serviceResponse> =>
  postJSON("/auth/set-info", { username, password });
