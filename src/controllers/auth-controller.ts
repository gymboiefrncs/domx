import type { NextFunction, Request, Response } from "express";
import { signupService } from "../services/auth-services.js";

export const signupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await signupService(req.body);
    res
      .status(201)
      .json({ success: true, message: "Signup successful", data: result });
  } catch (error) {
    next(error);
  }
};
