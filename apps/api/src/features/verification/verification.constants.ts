export const OTP_COOLDOWN_MS =
  process.env.NODE_ENV === "development" ? 5000 : 2 * 60 * 1000;
export const EMAIL_MESSAGE =
  "Verification email sent. Please check your inbox.";
export const COOLDOWN_MESSAGE = "Please wait before requesting another code.";
export const OTP_MESSAGE_FAIL = "OTP is invalid or expired";
export const OTP_MESSAGE_SUCCESS = "Email verified successfully";
export const RESEND_OTP_MESSAGE =
  "If an account exists, a new code has been sent.";
export const SET_INFO_SECRET = new TextEncoder().encode(
  process.env.SET_PASSWORD_TOKEN!,
);
