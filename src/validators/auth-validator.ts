import type { NextFunction, Request, Response } from "express";
import { signupSchema } from "../schemas/auth-schema.js";
import * as z from "zod";

export const signupValidator = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const validation = signupSchema.safeParse(req.body);

  if (!validation.success) {
    z.prettifyError(validation.error);
  }

  req.body = validation.data;
  next();
};
