import type { Response } from "express";
import { config } from "@api/shared/config.js";

const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_MAX_AGE_MS = 5 * 60 * 1000;

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
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });

  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
};
