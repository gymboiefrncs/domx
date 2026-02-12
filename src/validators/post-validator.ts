import type { NextFunction, Request, Response } from "express";
import type { ZodObject } from "zod";
import { postSchema } from "../schemas/post-schema.js";

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

export const postValidator = validate(postSchema);
