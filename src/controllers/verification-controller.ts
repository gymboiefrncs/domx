import type { NextFunction, Request, Response } from "express";
import {
  verificationService,
  resendVerificationService,
} from "../services/verification-service.js";

export const verificationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await verificationService(req.body.otp);
    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
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
    res.status(200).json({
      success: true,
      message: result.message,
    });
    return;
  } catch (error) {
    next(error);
  }
};
