import type { NextFunction, Request, Response } from "express";
import { signupService, loginService } from "../services/auth-service.js";

export const signupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await signupService(req.body);
    res.status(201).json({ success: true, message: result.message });
    return;
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await loginService(req.body);
    res
      .status(200)
      .json({ success: true, message: "Login successful", data: result });
  } catch (error) {
    next(error);
  }
};
