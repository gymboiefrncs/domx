import type { NextFunction, Request, Response } from "express";
import { validateOtp, resendOtp } from "./verification-service.js";
import { INCOMPLETE_SIGNUP_TOKEN_MAX_AGE } from "@api/common/constants.js";

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
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: INCOMPLETE_SIGNUP_TOKEN_MAX_AGE,
      });
    }
    const statusCode = result.ok ? 200 : 400;
    res.status(statusCode).json({
      success: result.ok,
      message: result.ok ? result.message : result.errMessage,
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
