import type { Request, Response } from "express";
import { signupService } from "../services/auth-services.js";

export const signupController = async (req: Request, res: Response) => {
  const result = await signupService(req.body);
  res.status(200).json({ message: "Signup successful", data: result });
  return;
};
