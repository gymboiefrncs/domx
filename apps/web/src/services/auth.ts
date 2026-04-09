import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { postJSON } from "@/lib/postJSON";
import type { ApiResponse } from "@/shared";
import { API_BASE_URL } from "@/config";
import { getApiErrorMessage } from "@/utils/error";

export const login = async (email: string, password: string) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data;
};

export const logout = async () => {
  const res = await fetchWithAuth(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data;
};

export const signup = (email: string): Promise<ApiResponse> =>
  postJSON("/auth/signup", { email });

export const verifyOTP = (email: string, otp: string): Promise<ApiResponse> =>
  postJSON("/verify-email", { email, otp });

export const resendOTP = (email: string): Promise<ApiResponse> =>
  postJSON("/resend-otp", { email });

export const setInfo = (
  username: string,
  password: string,
): Promise<ApiResponse> => postJSON("/auth/set-info", { username, password });
