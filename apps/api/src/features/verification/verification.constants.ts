import { config } from "@api/shared/config.js";

export const VERIFICATION_POLICY = {
  OTP_COOLDOWN_MS:
    config.server.nodeEnv === "development" ? 5000 : 2 * 60 * 1000,
} as const;

export const VERIFICATION_SUCCESS = {
  EMAIL_SENT: "Verification email sent. Please check your inbox.",
  OTP_VERIFIED: "Email verified successfully",
  RESEND_ACKNOWLEDGED: "If an account exists, a new code has been sent.",
} as const;

export const VERIFICATION_ERROR = {
  OTP_INVALID_OR_EXPIRED: "OTP is invalid or expired",
  COOLDOWN_ACTIVE: "Please wait before requesting another code.",
} as const;
