import type { NextFunction, Request, Response } from "express";
import { emailSchema, otpSchema } from "./verification-schema.js";
import type { ZodObject } from "zod";
import { ValidationError } from "../../utils/error.js";

export const validate =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      next(
        new ValidationError(
          "Invalid data",
          true,
          validation.error.flatten().fieldErrors,
        ),
      );
      return;
    }

    req.body = validation.data;
    next();
  };

export const OTPValidator = validate(otpSchema);
export const emailValidator = validate(emailSchema);
