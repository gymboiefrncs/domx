import { postJSON } from "@/shared/lib/postJSON";
import type { ApiResponse } from "@/shared/types";

export const login = (
  email: string,
  password: string,
): Promise<ApiResponse | undefined> =>
  postJSON("/auth/login", { email, password });

export const logout = (): Promise<ApiResponse | undefined> =>
  postJSON("/auth/logout");

export const signup = (email: string): Promise<ApiResponse | undefined> =>
  postJSON("/auth/signup", { email });

export const verifyOTP = (
  email: string,
  otp: string,
): Promise<ApiResponse | undefined> =>
  postJSON("/verify-email", { email, otp });

export const resendOTP = (email: string): Promise<ApiResponse | undefined> =>
  postJSON("/resend-otp", { email });

export const setInfo = (
  username: string,
  password: string,
): Promise<ApiResponse | undefined> =>
  postJSON("/auth/set-info", { username, password });
