import { httpClient } from "@/shared/lib/api/http.client";
import type { ApiResponse } from "@/shared/types";

export const login = (email: string, password: string) =>
  httpClient.post<ApiResponse>("/auth/login", { email, password });

export const logout = () => httpClient.post<ApiResponse>("/auth/logout");

export const signup = (email: string) =>
  httpClient.post<ApiResponse>("/auth/signup", { email });

export const verifyOTP = (email: string, otp: string) =>
  httpClient.post<ApiResponse>("/verify-email", { email, otp });

export const resendOTP = (email: string) =>
  httpClient.post<ApiResponse>("/resend-otp", { email });

export const setInfo = (username: string, password: string) =>
  httpClient.post<ApiResponse>("/auth/set-info", { username, password });
