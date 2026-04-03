import type { NextFunction, Request, Response } from "express";
import { validateOtp, resendOtp } from "./verification.services.js";
import { AUTH_TOKEN } from "@api/features/auth/index.js";
import { config } from "@api/shared/config.js";

export const verificationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const resendOtpHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await resendOtp(req.body.email);
    res.status(200).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
