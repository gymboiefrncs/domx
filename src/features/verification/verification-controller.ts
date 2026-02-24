import type { NextFunction, Request, Response } from "express";
import { validateOtp, resendOtp } from "./verification-service.js";

export const verificationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await validateOtp(req.body);
    const statusCode = result.ok ? 200 : 400;
    res.status(statusCode).json({
      success: result.ok,
      message: result.ok ? result : result.reason,
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
