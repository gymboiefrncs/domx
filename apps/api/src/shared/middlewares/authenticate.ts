import type { NextFunction, Request, Response } from "express";
import * as jose from "jose";
import type { Role } from "@domx/shared";
import { UnauthorizedError } from "../error.js";
import { config } from "../config.js";

const accessSecret = new TextEncoder().encode(config.jwt.accessTokenSecret);
const setInfoSecret = new TextEncoder().encode(config.jwt.setInfoTokenSecret);

export const jwtHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token: string | undefined = req.cookies.accessToken;
    if (!token) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    const { payload } = await jose.jwtVerify(token, accessSecret);

    const userId = payload.userId;
    const role = payload.role;
    if (typeof userId !== "string" || typeof role !== "string") {
      throw new UnauthorizedError("Invalid token payload");
    }

    req.user = { userId, role: role as Role };
    next();
  } catch (error) {
    next(error);
  }
};

export const verifySetInfoToken = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token: string | undefined = req.cookies.setInfoToken;
    if (!token) {
      throw new UnauthorizedError("Invalid or expired token");
    }
    const { payload } = await jose.jwtVerify(token, setInfoSecret);
    const userId = payload.sub;

    if (typeof userId !== "string" || payload.purpose !== "set-info") {
      throw new UnauthorizedError("Invalid token payload");
    }

    req.setInfo = { sub: userId, purpose: "set-info" };
    next();
  } catch (error) {
    next(error);
  }
};
