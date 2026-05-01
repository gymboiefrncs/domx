import type { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  rotateTokens,
  logoutUser,
} from "./auth.services.js";
import { setInfo } from "./auth.setInfo.js";
import { clearCookieOptions, setCookies } from "./auth-helpers/setCookies.js";
import { UnauthorizedError } from "@api/shared/error.js";
import { AUTH_TOKEN } from "./auth.constants.js";
import { generateSession } from "./auth-helpers/generateSession.js";
import { config } from "@api/shared/config.js";

export const signupHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await registerUser(req.body);
  if (result.reason === "INCOMPLETE_SIGNUP") {
    res.cookie("setInfoToken", result.data.setInfoToken, {
      httpOnly: true,
      secure: config.server.nodeEnv === "production",
      sameSite: "strict",
      maxAge: AUTH_TOKEN.INCOMPLETE_SIGNUP_MAX_AGE_MS,
    });
    res.status(200).json({
      success: true,
      message: result.reason,
    });
    return;
  }

  res.status(201).json({
    success: result.ok,
    message: result.message,
  });
};

export const loginHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { refreshToken, accessToken } = await loginUser(req.body);
  setCookies(refreshToken, accessToken, res);

  res.status(200).json({ success: true, message: "Login successful" });
};

export const rotateTokensHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) throw new UnauthorizedError("Invalid refresh token");
  const { accessToken, refreshToken } = await rotateTokens(oldRefreshToken);
  setCookies(refreshToken, accessToken, res);

  res.status(200).json({ success: true, message: "Token refreshed" });
};

export const logoutHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;
  const result = await logoutUser(refreshToken);
  res.clearCookie("refreshToken", clearCookieOptions);
  res.clearCookie("accessToken", clearCookieOptions);
  res.status(200).json({
    success: result.ok,
    message: result.ok ? result.message : "Logout failed",
  });
};

export const setInfoHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { password, username } = req.body;
  const userId = req.setInfo?.sub;
  if (!userId) throw new UnauthorizedError("Invalid token payload");

  const result = await setInfo({ userId, password, username });
  if (!result.ok) {
    res.status(400).json({ success: false, message: result.message });
    return;
  }

  const { refreshToken, accessToken } = await generateSession(userId);
  setCookies(refreshToken, accessToken, res);

  res.clearCookie("setInfoToken", clearCookieOptions);

  res.status(result.ok ? 200 : 400).json({
    success: result.ok,
    message: result.message,
  });
};
