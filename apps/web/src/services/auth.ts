import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { postJSON } from "@/lib/postJSON";
import type { ApiResponse } from "@/shared";

export const login = async (email: string, password: string) => {
  const res = await fetch("http://localhost:8080/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);
  return data;
};

export const logout = async () => {
  const res = await fetchWithAuth("http://localhost:8080/api/v1/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);
  return data;
};

export const signup = (email: string): Promise<ApiResponse> =>
  postJSON("/auth/signup", { email });

export const verifyOTP = (email: string, otp: string): Promise<ApiResponse> =>
  postJSON("/verify-email", { email, otp });

export const setInfo = (
  username: string,
  password: string,
): Promise<ApiResponse> => postJSON("/auth/set-info", { username, password });
