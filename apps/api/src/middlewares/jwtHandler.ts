import type { NextFunction, Request, Response } from "express";
import * as jose from "jose";
import type { Role } from "../common/types.js";
import { UnauthorizedError, ForbiddenError } from "../utils/error.js";

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN);
const setInfoSecret = new TextEncoder().encode(process.env.SET_PASSWORD_TOKEN);
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
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      throw new UnauthorizedError("Invalid or expired token");
    const token = authHeader.split(" ")[1]!;

    const { payload } = await jose.jwtVerify(token, setInfoSecret);

    if (payload.purpose !== "set-info")
      throw new ForbiddenError("Invalid token purpose");

    req.setInfo = {
      sub: payload.sub as string,
      purpose: payload.purpose as "set-info",
    };

    next();
  } catch (error) {
    next(error);
  }
};
