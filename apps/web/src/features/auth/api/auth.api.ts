import { httpClient } from "@/shared/lib/api/http.client";
import type { AuthApiResponse } from "@/shared/types";

export const login = async (email: string, password: string): Promise<void> => {
  await httpClient.post("/auth/login", { email, password });
};

export const logout = async (): Promise<void> => {
  await httpClient.post("/auth/logout");
};

export const setInfo = async (
  username: string,
  password: string,
): Promise<void> => {
  await httpClient.post("/auth/set-info", { username, password });
};

export const signup = async (email: string) => {
  const res = await httpClient.post<AuthApiResponse>("/auth/signup", { email });
  return res!.message;
};

export const verifyOTP = async (email: string, otp: string) => {
  const res = await httpClient.post<AuthApiResponse>("/verify-email", {
    email,
    otp,
  });
  return res!.message;
};

export const resendOTP = async (email: string) => {
  const res = await httpClient.post<AuthApiResponse>("/resend-otp", { email });
  return res!.message;
};
