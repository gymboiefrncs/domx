export type UserVerificationStatus = {
  id: string;
  user_id: string;
  expires_at: Date;
  otp_hash: string;
  used_at: Date | null;
  is_verified: boolean;
  retries: number;
};

export type Result =
  | { ok: true; message: string; data?: unknown }
  | { ok: false; message: string };

/**
 * `reason` is a machine-readable discriminant used for control flow (e.g. determining which email to send).
 * `message` is a user-facing string that is intended for display and is subject to change.
 *
 * By keeping them separate, we can freely change user-facing messages
 * without risking breaking any control flow logic.
 */
export type RegistrationResult =
  | { ok: true; reason: "NEW_USER"; email: string; message: string }
  | { ok: true; reason: "UNIQUE_EMAIL_VIOLATION"; message: string }
  | { ok: true; reason: "RESENT_OTP"; email: string; message: string }
  | { ok: true; reason: "ALREADY_VERIFIED"; email: string; message: string }
  | { ok: true; reason: "COOLDOWN"; message: string };

export type SetInfoResult =
  | { ok: true; reason: "INFO_SET_SUCCESS"; message: string }
  | { ok: false; reason: "INFO_SET_FAILED"; message: string };

export type Tokens = { accessToken: string; refreshToken: string };

export type Role = "user" | "moderator" | "admin";

export type CustomErrorContent = {
  message: string;
  context?: Record<string, unknown>;
};

export type EmailVerification = {
  id: string;
  user_id: string;
  expires_at: Date;
  otp_hash: string;
  used_at: Date | null;
  created_at: Date;
  retries: number;
};
