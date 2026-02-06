import type { NextFunction, Request, Response } from "express";
import { emailSchema, otpSchema } from "../schemas/verification-schema.js";
import type { ZodObject } from "zod";

export const validate =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      next(validation.error);
      return;
    }

    req.body = validation.data;
    next();
  };

export const OTPValidator = validate(otpSchema);
export const emailValidator = validate(emailSchema);
