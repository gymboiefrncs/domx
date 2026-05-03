import type { RequestHandler } from "express";
import { validateOtp, resendOtp } from "./verification.services.js";
import { AUTH_TOKEN } from "@api/features/auth/index.js";
import { config } from "@api/shared/config.js";
import type {
  ResendOtpRequest,
  VerificationRequest,
  VerificationResponse,
} from "./verification.types.js";

export const verificationHandler: RequestHandler<
  Record<string, never>,
  VerificationResponse,
  VerificationRequest
> = async (req, res) => {
  const result = await validateOtp(req.body);
  if (result.ok) {
    res.cookie("setInfoToken", result.data, {
      httpOnly: true,
      secure: config.server.nodeEnv === "production",
      sameSite: "strict",
      maxAge: AUTH_TOKEN.INCOMPLETE_SIGNUP_MAX_AGE_MS,
    });
    res.status(200).json({
      success: true,
      message: result.message,
    });
    return;
  }
  res.status(400).json({
    success: false,
    message: result.errMessage,
  });
};

export const resendOtpHandler: RequestHandler<
  Record<string, never>,
  VerificationResponse,
  ResendOtpRequest
> = async (req, res) => {
  const result = await resendOtp(req.body);
  res.status(200).json({
    success: result.ok,
    message: result.message,
  });
};
