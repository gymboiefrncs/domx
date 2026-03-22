export type OtpPayload = {
  otp: string;
  email: string;
};
export type ValidateOtpResult =
  | { ok: true; message: string; data: string }
  | { ok: false; errMessage: string };

export type TransactionResult =
  | { ok: true; userId: string }
  | { ok: false; errMessage: string };

export type ResendOtpResult =
  | { ok: true; reason: "ALREADY_VERIFIED"; email: string; message: string }
  | { ok: true; reason: "RESENT_OTP"; email: string; message: string }
  | { ok: true; reason: "COOLDOWN"; message: string }
  | { ok: true; reason: "USER_NOT_FOUND"; message: string };
