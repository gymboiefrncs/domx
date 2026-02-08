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
    const result = await verificationService(req.body);
    res.status(200).json({
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
    res.status(200).json({
      success: result.ok,
      message: result.ok ? result.message : result.reason,
    });
    return;
  } catch (error) {
    next(error);
  }
};
