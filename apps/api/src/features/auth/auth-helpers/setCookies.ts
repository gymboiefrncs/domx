import type { Response } from "express";
import {
  REFRESH_TOKEN_MAX_AGE,
  ACCESS_TOKEN_MAX_AGE,
} from "../auth.constants.js";
import { config } from "@api/shared/config.js";

const baseCookieOptions = {
  httpOnly: true,
  secure: config.server.nodeEnv === "production",
  sameSite: "strict" as const,
  path: "/",
};

export const clearCookieOptions = {
  ...baseCookieOptions,
};

export const setCookies = (
  refreshToken: string,
  accessToken: string,
  res: Response,
): void => {
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
};
