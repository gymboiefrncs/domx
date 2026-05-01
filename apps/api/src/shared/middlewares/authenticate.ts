import type { NextFunction, Request, Response } from "express";
import * as jose from "jose";
import { UnauthorizedError } from "../error.js";
import { config } from "../config.js";

const accessSecret = new TextEncoder().encode(config.jwt.accessTokenSecret);
const setInfoSecret = new TextEncoder().encode(config.jwt.setInfoTokenSecret);

export const jwtHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token: string | undefined = req.cookies.accessToken;
  if (!token) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  const { payload } = await jose.jwtVerify(token, accessSecret);

  const userId = payload.userId;
  if (typeof userId !== "string") {
    throw new UnauthorizedError("Invalid token payload");
  }

  req.user = { userId };
  next();
};
export const verifySetInfoToken = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
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
};
