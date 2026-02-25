import type { NextFunction, Request, Response } from "express";
import { type ZodObject } from "zod";
import {
  loginSchema,
  passwordSchema,
  signupSchema,
} from "../features/auth/auth-schema.js";
import { ValidationError } from "../utils/error.js";
import {
  emailSchema,
  otpSchema,
} from "../features/verification/verification-schema.js";
import { postSchema } from "../features/post/post-schema.js";

// Generic validation middleware factory
const validate =
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

export const loginValidator = validate(loginSchema);
export const signupValidator = validate(signupSchema);
export const passwordValidator = validate(passwordSchema);
export const otpValidator = validate(otpSchema);
export const emailValidator = validate(emailSchema);
export const postValidator = validate(postSchema);
