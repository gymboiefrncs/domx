import * as z from "zod";
import type { emailSchema, otpSchema } from "./verification.schemas.js";

interface VerificationBase {
  id: string;
  user_id: string;
  expires_at: Date;
  otp_hash: string;
  used_at: Date | null;
  retries: number;
}
export type UserVerificationStatus = VerificationBase & {
  is_verified: boolean;
};
export type EmailVerification = VerificationBase & {
  created_at: Date;
};

export type VerificationRequest = z.infer<typeof otpSchema>;
export type ResendOtpRequest = z.infer<typeof emailSchema>;
export type ValidateOtpResult =
  | { ok: true; message: string; data: string }
  | { ok: false; errMessage: string };

export type TransactionResult =
  | { ok: true; userId: string }
  | { ok: false; errMessage: string };
export type ResendOtpResult =
  | { reason: "ALREADY_VERIFIED"; email: string; message: string }
  | { reason: "RESENT_OTP"; email: string; message: string }
  | { reason: "COOLDOWN"; message: string }
  | { reason: "USER_NOT_FOUND"; message: string };

export interface VerificationResponse {
  message: string;
}
