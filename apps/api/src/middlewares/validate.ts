import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import {
  loginSchema,
  infoSchema,
  signupSchema,
} from "../features/auth/auth-schema.js";
import { ValidationError } from "../utils/error.js";
import {
  emailSchema,
  otpSchema,
} from "../features/verification/verification-schema.js";
import {
  ManageMemberSchema,
  GroupSchema,
  GroupParamsSchema,
} from "../features/groups/group-schema.js";
import type { ParamsDictionary } from "express-serve-static-core";
import {
  PostSchema,
  PostParamsSchema,
  EditPostParamsSchema,
  DeletePostParamsSchema,
} from "../features/posts/post-schema.js";

// Generic validation middleware factory
const validate =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
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
export const infoValidator = validate(infoSchema);
export const otpValidator = validate(otpSchema);
export const emailValidator = validate(emailSchema);
export const groupValidator = validate(GroupSchema);
export const postValidator = validate(PostSchema);

// For params
const validateParams =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.params);

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

    req.params = validation.data as ParamsDictionary;
    next();
  };

export const ManageMemberValidator = validateParams(ManageMemberSchema);
export const postParamsValidator = validateParams(PostParamsSchema);
export const editPostParamsValidator = validateParams(EditPostParamsSchema);
export const deletePostParamsValidator = validateParams(DeletePostParamsSchema);
export const groupParamsValidator = validateParams(GroupParamsSchema);
