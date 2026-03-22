import { postJSON } from "@/lib/postJSON";
import type { ApiResponse } from "@/shared";

export const signup = (email: string): Promise<ApiResponse> =>
  postJSON("/auth/signup", { email });

export const verifyOTP = (email: string, otp: string): Promise<ApiResponse> =>
  postJSON("/verify-email", { email, otp });

export const setInfo = (
  username: string,
  password: string,
): Promise<ApiResponse> => postJSON("/auth/set-info", { username, password });
