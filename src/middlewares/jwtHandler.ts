import type { NextFunction, Request, Response } from "express";
import * as jose from "jose";
import type { Role } from "../common/types.js";
import { UnauthorizedError } from "../utils/error.js";

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN);

export const jwtHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token: string | undefined = req.cookies.accessToken;
  if (!token) {
    throw new UnauthorizedError("No token provided");
  }

  try {
    const { payload } = await jose.jwtVerify(token, accessSecret);
    req.user = { userId: payload.userId as string, role: payload.role as Role };
    next();
  } catch (error) {
    throw new UnauthorizedError("Invalid token");
  }
};
