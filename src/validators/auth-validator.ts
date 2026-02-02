import type { NextFunction, Request, Response } from "express";
import { type ZodObject } from "zod";
import { signupSchema } from "../schemas/auth-schema.js";

// Generic validation middleware factory
const validate =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      next(validation.error);
      return;
    }

    req.body = validation.data;
    next();
  };

export const signupValidator = validate(signupSchema);
