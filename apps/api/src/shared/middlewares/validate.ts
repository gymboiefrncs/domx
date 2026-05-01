import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ValidationError } from "../error.js";
import type { ParamsDictionary } from "express-serve-static-core";

// Generic validation middleware factory
export const validateBody =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError("Invalid data", true, {
        source: "body",
        fields: validation.error.flatten().fieldErrors,
      });
    }

    req.body = validation.data;
    next();
  };

// For params
export const validateParams =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.params);

    if (!validation.success) {
      throw new ValidationError("Invalid data", true, {
        source: "params",
        fields: validation.error.flatten().fieldErrors,
      });
    }

    req.params = validation.data as ParamsDictionary;
    next();
  };
