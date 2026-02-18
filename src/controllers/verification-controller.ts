import type { NextFunction, Request, Response } from "express";
import {
  validateOtp,
  resendVerificationService,
} from "../services/verification-service.js";

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
      message: result.ok ? result.message : result.reason,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const resendVerificationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await resendVerificationService(req.body.email);
    const statusCode = result.ok ? 200 : 400;
    res.status(statusCode).json({
      success: result.ok,
      message: result.ok ? result.message : result.reason,
    });
    return;
  } catch (error) {
    next(error);
  }
};
