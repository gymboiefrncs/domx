import type { NextFunction, Request, Response } from "express";
import { verificationService } from "../services/verification-sevice.js";

export const verificationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await verificationService(req.body.token);
    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
    return;
  } catch (error) {
    next(error);
  }
};
