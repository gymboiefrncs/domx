import type { NextFunction, Request, Response } from "express";
import * as jose from "jose";
import type { Role } from "../common/types.js";
import { UnauthorizedError, ForbiddenError } from "../utils/error.js";

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN);
const setPasswordSecret = new TextEncoder().encode(
  process.env.SET_PASSWORD_TOKEN,
);
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
    req.user = { userId: payload.userId as string, role: payload.role as Role };
    next();
  } catch (error) {
    next(error);
  }
};

export const verifySetPasswordToken = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      throw new UnauthorizedError("Invalid or expired token");
    const token = authHeader.split(" ")[1]!;

    const { payload } = await jose.jwtVerify(token, setPasswordSecret);

    if (payload.purpose !== "set-password")
      throw new ForbiddenError("Invalid token purpose");

    req.setPwd = {
      sub: payload.sub as string,
      purpose: payload.purpose as "set-password",
    };

    next();
  } catch (error) {
    next(error);
  }
};
