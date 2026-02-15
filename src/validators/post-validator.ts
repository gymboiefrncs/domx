import type { NextFunction, Request, Response } from "express";
import type { ZodObject } from "zod";
import { postSchema } from "../schemas/post-schema.js";
import { ValidationError } from "../utils/error.js";

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

export const postValidator = validate(postSchema);
